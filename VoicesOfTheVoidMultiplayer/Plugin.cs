using BepInEx;
using UnityEngine;

namespace VoicesOfTheVoidMultiplayer
{
    [BepInPlugin("com.example.voicesofthevoid.multiplayer", "Voices of the Void Multiplayer", "0.1.0")]
    public class Plugin : BaseUnityPlugin
    {
        private void Awake()
        {
            Logger.LogInfo("Voices of the Void Multiplayer Mod loaded");
        }
    }
}
