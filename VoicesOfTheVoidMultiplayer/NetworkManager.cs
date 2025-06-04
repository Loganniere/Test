using UnityEngine;
using Mirror; // Mirror is a popular networking library for Unity

namespace VoicesOfTheVoidMultiplayer
{
    public class NetworkManagerVoices : NetworkManager
    {
        public override void OnServerConnect(NetworkConnectionToClient conn)
        {
            Debug.Log($"Client connected: {conn.connectionId}");
        }

        public override void OnClientConnect()
        {
            Debug.Log("Connected to server");
        }
    }
}
