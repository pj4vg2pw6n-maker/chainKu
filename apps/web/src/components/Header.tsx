import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b border-gray-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
        <Logo />
      </div>
    </header>
  );
}
