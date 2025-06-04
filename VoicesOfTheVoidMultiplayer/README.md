# Voices of the Void Multiplayer Mod

This folder contains a skeleton for a multiplayer mod for **Voices of the Void**.
It uses the [BepInEx](https://github.com/BepInEx/BepInEx) mod loader which is commonly used for Unity games.

## Building
1. Install BepInEx for your game.
2. Build the `VoicesOfTheVoidMultiplayer.csproj` using the .NET SDK (e.g. `dotnet build`).
3. Place the compiled DLL into `BepInEx/plugins` in your game directory.

## Features
This skeleton only logs a startup message. You can extend it with networking functionality
using a library such as [Mirror](https://mirror-networking.com/) to handle connections
between players.

## Directory Structure
- `VoicesOfTheVoidMultiplayer.csproj` – project file
- `Plugin.cs` – main BepInEx plugin
- `NetworkManager.cs` – basic networking stub
