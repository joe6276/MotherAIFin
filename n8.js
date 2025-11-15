// Test the webhook
fetch('https://ndambuki.app.n8n.cloud/webhook-test/c1b6485a-158c-4e08-9aec-ddb3bb726ad3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ 
    prompt: "Build an SEO Friendly Website" 
  })
})
.then(r => r.json())
.then(data => console.log(data));

