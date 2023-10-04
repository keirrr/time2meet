import time2meetLogo from "../assets/imgs/time2meet-logo.svg";
import { default as Link, default as LinkButton } from "./LinkButton";

export default function Navbar() {
  return (
    <nav className="absolute left-0 top-0 w-full p-5 flex align-center">
      <a href="/">
        <img src={time2meetLogo} className="h-8" />
      </a>
    </nav>
  );
}
