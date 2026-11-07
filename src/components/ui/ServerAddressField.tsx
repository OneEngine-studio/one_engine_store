import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { formatServerAddress, parseServerAddress } from '../../lib/nakama';

interface ServerAddressFieldProps {
  id: string;
  inputClassName: string;
  /** Called after a valid address has been applied. */
  onApplied?: () => void;
}

/** One field for the whole server address; paste a URL and the parts are filled in. */
export const ServerAddressField: React.FC<ServerAddressFieldProps> = ({ id, inputClassName, onApplied }) => {
  const { settings, updateSettings } = useStore();
  const current = formatServerAddress({
    host: settings.nakamaHost,
    port: settings.nakamaPort,
    useSsl: settings.nakamaUseSsl,
    basePath: settings.nakamaBasePath,
  });
  const [text, setText] = useState(current);
  const [invalid, setInvalid] = useState(false);

  // Follow changes made elsewhere (e.g. the individual fields in Settings).
  useEffect(() => {
    setText(current);
    setInvalid(false);
  }, [current]);

  const apply = () => {
    if (text.trim() === current) return;
    const parsed = parseServerAddress(text);
    if (!parsed) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    updateSettings({
      nakamaHost: parsed.host,
      nakamaPort: parsed.port,
      nakamaUseSsl: parsed.useSsl,
      nakamaBasePath: parsed.basePath,
    });
    onApplied?.();
  };

  return (
    <>
      <input
        id={id}
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setInvalid(false);
        }}
        onBlur={apply}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="https://play.example.com"
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={inputClassName}
      />
      {invalid && (
        <p id={`${id}-error`} className="text-[11px] text-danger mt-1">
          That doesn't look like a server address. Try https://host or host:7350.
        </p>
      )}
    </>
  );
};
