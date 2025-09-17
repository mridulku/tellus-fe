// styles.js

// The main overlay background
export const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  
  // The main container (modal) style
  export const modalStyle = {
    width: "90%",
    height: "90%",
    background: "linear-gradient(to bottom right, #1e1e1e, #444)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 0 40px rgba(0,0,0,0.8)",
    overflow: "hidden",
  };
  
  // The top bar at the top of the modal (exam info, close button)
  export const topBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#222",
    padding: "10px 20px",
    color: "#fff",
  };
  
  // A sub-style for the left part of the top bar (like exam info)
  export const topBarLeftStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  };
  
  // Timer font style (the “xx:yy left” part)
  export const timerStyle = {
    fontSize: "1.2rem",
    color: "#FFD700",
  };
  
  // The main area that holds the left playlist panel and the center content
  export const mainAreaStyle = {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  };
  
  // The left side panel (playlist of steps or chapters)
  export const playlistPanelStyle = {
    width: "250px",
    backgroundColor: "#2c2c2c",
    color: "#fff",
    padding: "20px",
    overflowY: "auto",
  };
  
  // The bottom bar (progress bar area)
  export const bottomBarStyle = {
    backgroundColor: "#222",
  };
  
  // The main content area style (where steps get rendered)
  export const contentAreaStyle = {
    flex: 1,
    padding: "30px",
    color: "#fff",
    overflowY: "auto",
    position: "relative",
  };
  
  // A style for an inner content “card” or block (white box style)
  export const contentInnerStyle = {
    maxWidth: "650px",
    margin: "0 auto",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  };
  
  // A row for navigation buttons (like “Back”/“Next”)
  export const buttonRowStyle = {
    marginTop: "20px",
    display: "flex",
    gap: "10px",
  };
  
  // Primary button style (gold background)
  export const primaryButtonStyle = {
    backgroundColor: "#FFD700",
    color: "#000",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
  };
  
  // Secondary button style (gray background)
  export const secondaryButtonStyle = {
    backgroundColor: "#666",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    cursor: "pointer",
  };
  
  // Progress bar container
  export const progressBarContainer = {
    width: "250px",
    height: "10px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "5px",
    overflow: "hidden",
  };
  
  // Progress bar fill (the moving gold bar)
  export const progressBarFill = {
    height: "100%",
    backgroundColor: "#FFD700",
    transition: "width 0.4s",
  };
  
  /* ----------------- Chat Panel Styles ----------------- */
  
  // The collapsible chat panel in the bottom-right corner
  export const chatPanelContainerStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "300px",
    backgroundColor: "#1f1f1f",
    border: "1px solid #444",
    borderRadius: "8px",
    color: "#fff",
    overflow: "hidden",
    transition: "height 0.3s",
    display: "flex",
    flexDirection: "column",
  };
  
  // The clickable header row of the chat
  export const chatHeaderStyle = {
    padding: "8px 12px",
    backgroundColor: "#333",
    cursor: "pointer",
  };
  
  // The main chat body (holds messages + input)
  export const chatBodyStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
  
  // The scrollable area containing chat messages
  export const chatMessagesStyle = {
    flex: 1,
    padding: "8px 12px",
    overflowY: "auto",
  };
  
  // The row holding the text input and send button
  export const chatInputContainerStyle = {
    display: "flex",
    borderTop: "1px solid #444",
  };
  
  // The chat text input
  export const chatInputStyle = {
    flex: 1,
    padding: "8px",
    border: "none",
    outline: "none",
    backgroundColor: "#2a2a2a",
    color: "#fff",
  };
  
  // The “Send” button
  export const chatSendButtonStyle = {
    backgroundColor: "#FFD700",
    color: "#000",
    border: "none",
    outline: "none",
    padding: "8px 16px",
    cursor: "pointer",
  };


  // styles.js

