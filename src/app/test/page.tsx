export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this, the server is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  );
}