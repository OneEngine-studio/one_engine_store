import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { normalizePlatformUrl } from '../../lib/platformApi';

interface ServerAddressFieldProps {
  id: string;
  inputClassName: string;
  /** Called after a valid address has been applied. */
  onApplied?: () => void;
}

/** The OneEngine service address. Applies on blur or Enter once it parses as an http(s) URL. */
export const ServerAddressField: React.FC<ServerAddressFieldProps> = ({ id, inputClassName, onApplied }) => {
  const { settings, updateSettings } = useStore();
  const current = settings.platformApiUrl;
  const [text, setText] = useState(current);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(current);
    setInvalid(false);
  }, [current]);

  const apply = () => {
    if (text.trim() === current) return;
    const url = normalizePlatformUrl(text);
    if (!url) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    updateSettings({ platformApiUrl: url });
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
        placeholder="http://127.0.0.1:8080"
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={inputClassName}
      />
      {invalid && (
        <p id={`${id}-error`} className="text-[11px] text-danger mt-1">
          That doesn't look like an address. Try http://127.0.0.1:8080 or https://api.example.com.
        </p>
      )}
    </>
  );
};
