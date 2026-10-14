import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getSignedS3Url } from '../../utils/s3Helper';

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & { path: string };

export const PrivateFileLink: React.FC<Props> = ({ path, children, ...props }) => {
  const [busy, setBusy] = useState(false);
  return <a {...props} href="#" aria-busy={busy} onClick={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    try {
      const url = await getSignedS3Url(path);
      if (popup) popup.location.replace(url);
      else window.location.assign(url);
    } catch {
      popup?.close();
      toast.error('Could not download this document. Please sign in and try again.');
    } finally { setBusy(false); }
  }}>{children}</a>;
};
