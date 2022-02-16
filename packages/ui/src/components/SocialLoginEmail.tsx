import { FormEvent } from "react";

interface SocialLoginEmailProps {
  adapter: string;
  handleSocialLoginClick: (params: { adapter: string; loginParams: { loginProvider: string; login_hint?: string } }) => void;
}
export default function SocialLoginEmail(props: SocialLoginEmailProps) {
  const { handleSocialLoginClick, adapter } = props;
  const handleEmailSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = ((e.target as HTMLFormElement)[0] as HTMLInputElement).value;
    if (email) handleSocialLoginClick({ adapter, loginParams: { loginProvider: "email_passwordless", login_hint: email } });
  };
  return (
    <div className="w3ajs-email-passwordless w3a-group w3a-group--email">
      <h6 className="w3a-group__title">EMAIL</h6>
      <form className="w3ajs-email-passwordless-form" onSubmit={(e) => handleEmailSubmit(e)}>
        <input className="w3a-text-field" type="email" name="email" required placeholder="Email" />
        <button className="w3a-button" type="submit">
          Continue with Email
        </button>
      </form>
    </div>
  );
}
