import '../globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div id="app">{children}</div>;
}
