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
  min-height: 100%;
  background: #eef2f7;
}

body {
  overflow-y: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

#root, body > div:first-child {
  min-height: 100vh;
}

@media (min-width: 768px) {
  body {
    display: flex;
    justify-content: center;
  }

  #root, body > div:first-child {
    width: 100%;
    max-width: 430px;
    background: #eef2f7;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  }
}
`;
