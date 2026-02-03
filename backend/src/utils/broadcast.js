export function createBroadcast(wsClients) {
  function broadcast(event, data) {
    const message = JSON.stringify({ event, data });
    const clientCount = wsClients.size;
    wsClients.forEach(client => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
    console.log(`[Broadcast] ${event} to ${clientCount} clients`);
  }
  return broadcast;
}
