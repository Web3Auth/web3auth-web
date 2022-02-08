export default function SocialLoginEmail(props) {
  return (
    <div className="w3ajs-email-passwordless w3a-group w3a-group--email-hidden">
      <h6 className="w3a-group__title">EMAIL</h6>
      <form className="w3ajs-email-passwordless-form">
        <input className="w3a-text-field" type="email" name="email" required placeholder="Email" />
        <button className="w3a-button" type="submit">
          Continue with Email
        </button>
      </form>
    </div>
  );
}
