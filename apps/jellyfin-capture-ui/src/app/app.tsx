import styles from './app.module.css';

export function App() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="welcome-heading">
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            ▶
          </span>
          <span>Jellyfin Capture</span>
        </div>

        <p className={styles.eyebrow}>Local media bookmarker</p>
        <h1 id="welcome-heading">Hello, world!</h1>
        <p className={styles.description}>
          The starter page is up. Jellyfin and Google Sheets are not connected
          yet.
        </p>

        <div
          className={styles.status}
          aria-label="Integration status: not configured"
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <span>Placeholder mode</span>
        </div>
      </section>
    </main>
  );
}

export default App;

if (import.meta.vitest) {
  const { it, expect, beforeEach } = import.meta.vitest;
  let render: typeof import('@testing-library/react').render;

  beforeEach(async () => {
    render = (await import('@testing-library/react')).render;
  });

  it('renders the greeting and placeholder integration status', () => {
    const { getByRole, getByText } = render(<App />);
    expect(getByRole('heading', { name: 'Hello, world!' })).toBeTruthy();
    expect(
      getByText(
        'The starter page is up. Jellyfin and Google Sheets are not connected yet.'
      )
    ).toBeTruthy();
  });
}
