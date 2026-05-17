import { createRoot } from "react-dom/client";
import React from "react";
import { App } from "./app/App";
import "./styles.css";

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("React render failed", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatalErrorPage">
        <section className="fatalErrorCard">
          <span>렌더링 오류</span>
          <h1>화면을 그리는 중 오류가 발생했습니다.</h1>
          <pre>{this.state.error.message}</pre>
          <button type="button" onClick={() => window.location.reload()}>새로고침</button>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
