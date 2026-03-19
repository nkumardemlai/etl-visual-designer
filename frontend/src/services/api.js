import axios from 'axios'

const BASE_URL = 'http://localhost:8080/api/pipeline'

export async function generateSparkCode(nodes, edges) {
  const response = await axios.post(`${BASE_URL}/generate`, { nodes, edges }, {
    headers: { 'Content-Type': 'application/json' },
    responseType: 'text',
  })
  return response.data
}

export async function getNodeTypes() {
  const response = await axios.get(`${BASE_URL}/node-types`)
  return response.data
}
