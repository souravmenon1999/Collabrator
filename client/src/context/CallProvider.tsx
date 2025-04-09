import AgoraRTC from "agora-rtc-sdk-ng";
import { AgoraRTCProvider } from "agora-rtc-react";

export const Client = ({ children }) => {
  return (
    <AgoraRTCProvider client={AgoraRTC.createClient({ mode: "rtc", codec: "vp8" })}>
      {children}
    </AgoraRTCProvider>
  );
};
