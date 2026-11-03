using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace OneEngine.Integration
{
    /// <summary>
    /// OneEngine Store Headless Authentication Receiver for Unity (Railbound).
    /// Supports both zero-exposure Environment Variable IPC (Primary) and CLI argument fallback.
    /// Attach this script to a GameObject in your initial bootstrap scene (e.g., Bootstrapper / Splash).
    /// </summary>
    [DisallowMultipleComponent]
    public class LauncherAuthReceiver : MonoBehaviour
    {
        [Header("Scene Navigation")]
        [Tooltip("Name of the scene to load when valid launcher credentials are provided.")]
        [SerializeField] private string targetLobbySceneName = "GameLobby";

        [Tooltip("Fallback scene to load if launched standalone (e.g. LoginMenu or Warning Scene).")]
        [SerializeField] private string fallbackLoginSceneName = "LoginMenu";

        [Header("Runtime State (Read Only)")]
        [SerializeField] private bool hasValidLauncherAuth = false;
        [SerializeField] private string cachedPlayerName = string.Empty;
        [SerializeField] private string cachedUserId = string.Empty;
        [SerializeField] private string authVector = "NONE";

        // Static session properties accessible across any Unity gameplay scripts
        public static string AuthToken { get; private set; } = string.Empty;
        public static string PlayerName { get; private set; } = string.Empty;
        public static string UserId { get; private set; } = string.Empty;
        public static bool IsAuthenticated => !string.IsNullOrEmpty(AuthToken);

        private bool showStandaloneWarning = false;
        private string statusMessage = string.Empty;

        private void Awake()
        {
            // Persist this object across scene loads so GameLobby can access session data
            DontDestroyOnLoad(gameObject);

            InitializeSessionAuth();
        }

        private void Start()
        {
            if (hasValidLauncherAuth)
            {
                Debug.Log($"<color=#FF7A00>[OneEngine]</color> Valid session received via {authVector} for operative: '{PlayerName}' (UID: {UserId}).");
                Debug.Log($"<color=#10B981>[OneEngine]</color> Bypassing '{fallbackLoginSceneName}' -> Navigating directly to '{targetLobbySceneName}'...");
                
                // Immediately transition to GameLobby
                SceneManager.LoadScene(targetLobbySceneName);
            }
            else
            {
                Debug.LogWarning("<color=#EF4444>[OneEngine]</color> Standalone launch detected without session credentials.");
                statusMessage = "Access Denied: Please launch Railbound via the OneEngine Store desktop client.";
                showStandaloneWarning = true;

                // If fallback scene is defined and different from current, navigate there
                if (!string.IsNullOrEmpty(fallbackLoginSceneName) && 
                    SceneManager.GetActiveScene().name != fallbackLoginSceneName)
                {
                    // SceneManager.LoadScene(fallbackLoginSceneName);
                }
            }
        }

        /// <summary>
        /// Reads session credentials via high-security Environment Variables (prevents CLI sniffing)
        /// with graceful fallback to CLI arguments for backward compatibility.
        /// </summary>
        private void InitializeSessionAuth()
        {
            // Vector 1: High-Security Process Environment Injection (Primary Vector)
            string envToken = Environment.GetEnvironmentVariable("ONEENGINE_AUTH_TOKEN");
            if (!string.IsNullOrWhiteSpace(envToken))
            {
                AuthToken = envToken;
                PlayerName = Environment.GetEnvironmentVariable("ONEENGINE_PLAYER_NAME") ?? "Operative";
                UserId = Environment.GetEnvironmentVariable("ONEENGINE_USER_ID") ?? "usr_anonymous";
                cachedPlayerName = PlayerName;
                cachedUserId = UserId;
                authVector = "SECURE_ENV_IPC";
                hasValidLauncherAuth = true;
                return;
            }

            // Vector 2: Fallback to Command-Line Arguments (Legacy Runner Vector)
            ParseCommandLineArguments();
        }

        /// <summary>
        /// Parses Windows OS command line arguments looking for OneEngine injection flags.
        /// Supports both formats: '--key value' and '--key=value'.
        /// </summary>
        private void ParseCommandLineArguments()
        {
            string[] args = Environment.GetCommandLineArgs();
            var parsedArgs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];

                if (arg.StartsWith("--"))
                {
                    if (arg.Contains("="))
                    {
                        string[] parts = arg.Substring(2).Split(new[] { '=' }, 2);
                        if (parts.Length == 2)
                        {
                            parsedArgs[parts[0]] = parts[1].Trim('\"');
                        }
                    }
                    else if (i + 1 < args.Length && !args[i + 1].StartsWith("--"))
                    {
                        parsedArgs[arg.Substring(2)] = args[i + 1].Trim('\"');
                        i++; // Skip next token as it's the value
                    }
                }
            }

            // Extract session credentials injected by launcher
            if (parsedArgs.TryGetValue("auth-token", out string token) && !string.IsNullOrWhiteSpace(token))
            {
                AuthToken = token;
                
                parsedArgs.TryGetValue("player-name", out string pName);
                PlayerName = !string.IsNullOrWhiteSpace(pName) ? pName : "Operative";
                cachedPlayerName = PlayerName;

                parsedArgs.TryGetValue("user-id", out string uId);
                UserId = !string.IsNullOrWhiteSpace(uId) ? uId : "usr_anonymous";
                cachedUserId = UserId;

                authVector = "CLI_FLAGS";
                hasValidLauncherAuth = true;
            }
        }

        /// <summary>
        /// Tactical fallback UI displayed if the binary was launched standalone by double-clicking Railbound.exe
        /// </summary>
        private void OnGUI()
        {
            if (!showStandaloneWarning) return;

            int width = 500;
            int height = 240;
            int x = (Screen.width - width) / 2;
            int y = (Screen.height - height) / 2;

            GUI.Box(new Rect(x, y, width, height), "ONEENGINE SECURITY PROTOCOL");

            var labelStyle = new GUIStyle(GUI.skin.label)
            {
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                fontSize = 14
            };

            GUI.Label(new Rect(x + 20, y + 40, width - 40, 80), statusMessage, labelStyle);

            if (GUI.Button(new Rect(x + 75, y + 140, 160, 45), "QUIT GAME"))
            {
                Application.Quit();
            }

            if (GUI.Button(new Rect(x + 265, y + 140, 160, 45), "CONTINUE AS GUEST"))
            {
                showStandaloneWarning = false;
                SceneManager.LoadScene(targetLobbySceneName);
            }
        }
    }
}
