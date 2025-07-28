import "./Login.css";


const Login = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/login"; // Flask route
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>TRADE FLOW</h1>
        <p>Smart trading powered by Zerodha.</p>
        <button onClick={handleLogin} className="login-button">Login with Zerodha</button>
      </div>
      <div className="login-right">
        <img src="/illustration.png" alt="Login visual" />
      </div>
    </div>
  );
};
export default Login;
