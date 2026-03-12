export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#eef2f7" />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background: #eef2f7;
}

body {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

#root,
#root > div,
body > div:first-child,
body > div:first-child > div {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

@media (min-width: 768px) {
  body {
    justify-content: center;
  }

  #root,
  #root > div,
  body > div:first-child,
  body > div:first-child > div {
    width: 100%;
    max-width: 430px;
    background: #eef2f7;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  }
}
`;
