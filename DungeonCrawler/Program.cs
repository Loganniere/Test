using System;
using System.Collections.Generic;

namespace DungeonCrawler
{
    class Program
    {
        static void Main()
        {
            Console.WriteLine("Welcome to the Dungeon!");
            var player = new Player();

            for (int roomIndex = 1; player.IsAlive; roomIndex++)
            {
                Console.WriteLine($"\nEntering room {roomIndex}...");
                Room room = Room.Generate();
                if (room.Monster != null)
                {
                    Console.WriteLine($"A {room.Monster.Name} appears!");
                    Fight(player, room.Monster);
                    if (!player.IsAlive)
                    {
                        Console.WriteLine("You died! Game over.");
                        break;
                    }
                }
                foreach (var item in room.Loot)
                {
                    player.AddItem(item);
                }
                Console.WriteLine("Move to next room? (y/n)");
                var key = Console.ReadKey(true).Key;
                if (key != ConsoleKey.Y)
                    break;
            }
            if (player.IsAlive)
                Console.WriteLine("You exit the dungeon alive. Congratulations!");
        }

        static void Fight(Player player, Monster monster)
        {
            while (player.IsAlive && monster.IsAlive)
            {
                monster.TakeDamage(player.AttackPower);
                Console.WriteLine($"You hit the {monster.Name}! Its HP: {monster.Health}");
                if (!monster.IsAlive)
                {
                    Console.WriteLine($"You defeated the {monster.Name}!");
                    break;
                }
                player.TakeDamage(monster.Attack);
                Console.WriteLine($"The {monster.Name} hits you! Your HP: {player.Health}");
            }
        }
    }
}
