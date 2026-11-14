using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Nakama;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace OneEngine.Integration
{
    /// <summary>
    /// Store sign-in for Railbound. Attach to a GameObject in the first scene (Bootstrapper / Splash).
    ///
    /// The OneEngine launcher starts the game with a one-time launch ticket:
    ///   Railbound.exe --oe-ticket=&lt;ticket&gt; --oe-user=&lt;userId&gt; --oe-name=&lt;callsign&gt;
    /// The ticket is valid for 60 seconds and works once. This script trades it for a Nakama session with
    /// AuthenticateCustom; the Nakama server hook redeems it with the Platform API and checks ownership.
    /// No password or long-lived token ever appears on the command line.
    /// </summary>
    [DisallowMultipleComponent]
    public class LauncherAuthReceiver : MonoBehaviour
    {
        [Header("Nakama")]
        [SerializeField] private string nakamaScheme = "https";
        [SerializeField] private string nakamaHost = "127.0.0.1";
        [SerializeField] private int nakamaPort = 7350;
        [Tooltip("Change before any public build. Must match the server's socket.server_key.")]
        [SerializeField] private string nakamaServerKey = "defaultkey";

        [Header("Scene Navigation")]
        [SerializeField] private string targetLobbySceneName = "GameLobby";

        [Header("Development")]
        [Tooltip("Lets the editor and development builds continue without a launcher ticket. Ignored in release builds.")]
        [SerializeField] private bool allowStandaloneInDevelopment = true;

        // Session state for the rest of the game. AuthToken is the Nakama session token.
        public static IClient Client { get; private set; }
        public static ISession Session { get; private set; }
        public static string AuthToken => Session?.AuthToken ?? string.Empty;
        public static string NakamaRefreshToken => Session?.RefreshToken ?? string.Empty;
        public static string PlayerName { get; private set; } = string.Empty;
        public static string UserId => Session?.UserId ?? string.Empty;
        public static bool IsAuthenticated => Session != null && !Session.IsExpired;

        private enum State { Starting, SigningIn, Failed }
        private State state = State.Starting;
        private string statusMessage = string.Empty;

        private bool CanSkipSignIn => allowStandaloneInDevelopment && (Application.isEditor || Debug.isDebugBuild);

        private async void Start()
        {
            DontDestroyOnLoad(gameObject);

            string ticket = ReadArgument("oe-ticket");
            string name = ReadArgument("oe-name");
            PlayerName = string.IsNullOrWhiteSpace(name) ? "Operative" : name;

            if (string.IsNullOrWhiteSpace(ticket))
            {
                Debug.LogWarning("[OneEngine] No --oe-ticket argument: the game was not started by the store.");
                Fail("Please start Railbound from the OneEngine Store.");
                return;
            }

            state = State.SigningIn;
            statusMessage = "Signing in…";
            try
            {
                await SignInWithTicket(ticket);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[OneEngine] Ticket sign-in failed: {e.Message}");
                Fail("Sign-in failed. Close the game and press Play in the store again.");
                return;
            }

            Debug.Log($"[OneEngine] Signed in as '{PlayerName}' ({UserId}). Loading '{targetLobbySceneName}'.");
            SceneManager.LoadScene(targetLobbySceneName);
        }

        private async Task SignInWithTicket(string ticket)
        {
            Client = new Nakama.Client(nakamaScheme, nakamaHost, nakamaPort, nakamaServerKey, UnityWebRequestAdapter.Instance);

            // A ticket works once, so a silent retry after a timeout could present a spent ticket.
            Client.GlobalRetryConfiguration = new RetryConfiguration(baseDelayMs: 500, maxRetries: 0);

            // The server hook swaps the ticket for the stable "oe:<userId>" identity and sets the username.
            Session = await Client.AuthenticateCustomAsync(ticket, username: null, create: true);
            if (!string.IsNullOrEmpty(Session.Username)) PlayerName = Session.Username;
        }

        private void Fail(string message)
        {
            if (CanSkipSignIn)
            {
                Debug.Log("[OneEngine] Development mode: continuing without a store session.");
                SceneManager.LoadScene(targetLobbySceneName);
                return;
            }
            state = State.Failed;
            statusMessage = message;
        }

        /// <summary>Reads "--key=value" or "--key value" from the command line; empty when absent.</summary>
        private static string ReadArgument(string key)
        {
            string[] args = Environment.GetCommandLineArgs();
            string flag = "--" + key;
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (arg.StartsWith(flag + "=", StringComparison.OrdinalIgnoreCase))
                    return arg.Substring(flag.Length + 1).Trim('"');
                if (string.Equals(arg, flag, StringComparison.OrdinalIgnoreCase) &&
                    i + 1 < args.Length && !args[i + 1].StartsWith("--"))
                    return args[i + 1].Trim('"');
            }
            return string.Empty;
        }

        private void OnGUI()
        {
            if (state == State.Starting) return;

            const int width = 500;
            const int height = 200;
            int x = (Screen.width - width) / 2;
            int y = (Screen.height - height) / 2;

            GUI.Box(new Rect(x, y, width, height), "ONEENGINE");

            var labelStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                fontSize = 14
            };
            GUI.Label(new Rect(x + 20, y + 40, width - 40, 80), statusMessage, labelStyle);

            if (state == State.Failed && GUI.Button(new Rect(x + 170, y + 130, 160, 45), "QUIT GAME"))
            {
                Application.Quit();
            }
        }
    }
}
