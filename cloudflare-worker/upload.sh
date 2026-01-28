#!/bin/bash
cat > metadata.json << 'EOF'
{
  "main_module": "cors-proxy.js"
}
EOF

curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/73d7303e30a385ecae048d6a26f94683/workers/scripts/crxreview-cors-proxy" \
  -H "Authorization: Bearer vj797P0WB4Z0WW0i6glDdqE82Ws3s8Dr0tyjLJU3" \
  -F "metadata=@metadata.json;type=application/json" \
  -F "cors-proxy.js=@cors-proxy.js;type=application/javascript+module"
