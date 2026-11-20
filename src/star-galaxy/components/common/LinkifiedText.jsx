import React from 'react';
import { ExternalLink } from 'lucide-react';
import { isGoogleDoc, getGoogleServiceInfo } from '../../utils/embedUtils';

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi;

export default function LinkifiedText({
  text,
  className = '',
  linkClassName = '',
  as: Component = 'span',
}) {
  if (text === null || text === undefined || text === '') {
    return null;
  }

  const str = String(text);

  // Split string into non-URL parts and URL parts
  const parts = str.split(URL_REGEX);

  if (parts.length === 1) {
    return <Component className={className}>{str}</Component>;
  }

  return (
    <Component className={className}>
      {parts.map((part, index) => {
        const isUrl =
          typeof part === 'string' &&
          (part.startsWith('http://') ||
            part.startsWith('https://') ||
            part.startsWith('www.'));

        if (!isUrl) {
          return <React.Fragment key={index}>{part}</React.Fragment>;
        }

        const href = part.startsWith('www.') ? `https://${part}` : part;
        const isGDoc = isGoogleDoc(part);
        const gInfo = isGDoc ? getGoogleServiceInfo(part) : null;

        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Open: ${part}`}
            className={
              linkClassName ||
              'inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 hover:decoration-blue-700 break-all transition-colors cursor-pointer bg-blue-50/80 hover:bg-blue-100 px-1.5 py-0.5 rounded-lg mx-0.5 shadow-2xs border border-blue-200/80 align-baseline'
            }
          >
            {isGDoc && (
              <span className="text-xs shrink-0 select-none">{gInfo?.icon}</span>
            )}
            <span className="break-all">{part}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-75 inline" />
          </a>
        );
      })}
    </Component>
  );
}
