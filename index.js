const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
let config = {};
try {
    config = require('./config.json');
} catch (e) {
    // Fallback to Railway Environment Variables
    config = {
        token: process.env.DISCORD_TOKEN,
        channelId: process.env.DISCORD_CHANNEL_ID,
        gameId: process.env.ROBLOX_GAME_ID,
        interval: process.env.UPDATE_INTERVAL || 30000
    };
}


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Variable to store the last known update time
let lastUpdatedTime = null;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Tracking Universe ID: ${config.universeId}`);
    
    // Start checking every X milliseconds (defined in your config, e.g., 30000)
    setInterval(checkGameUpdate, config.updateInterval);
});

async function checkGameUpdate() {
    try {
        // Fetch data from the official Roblox Games API
        const response = await axios.get(`https://roblox.com{config.universeId}`);
        const gameData = response.data.data[0];

        if (!gameData) return;

        const currentUpdateTime = gameData.updated; // Format: "2026-09-25T15:20:00Z"
        const channel = await client.channels.fetch(config.channelId);

        // First run: establish a baseline timestamp so it doesn't instantly ping
        if (lastUpdatedTime === null) {
            lastUpdatedTime = currentUpdateTime;
            console.log(`Baseline set. Last update was: ${lastUpdatedTime}`);
            return;
        }

        // If the timestamp has changed, the game was updated!
        if (currentUpdateTime !== lastUpdatedTime) {
            lastUpdatedTime = currentUpdateTime;

            const embed = new EmbedBuilder()
                .setTitle(`🚨 Game Update Detected!`)
                .setDescription(`**[${gameData.name}](https://roblox.com{gameData.rootPlaceId})** has just been updated by the developer!`)
                .addFields(
                    { name: 'Active Players', value: gameData.playing.toLocaleString(), inline: true },
                    { name: 'Total Visits', value: gameData.visits.toLocaleString(), inline: true }
                )
                .setColor('#FF0000')
                .setTimestamp(new Date(currentUpdateTime));

            await channel.send({ content: "@everyone The game has updated!", embeds: [embed] });
            console.log("Change detected! Alert sent to Discord.");
        }

    } catch (error) {
        console.error("Error fetching Roblox API:", error.message);
    }
}

// Login using the token passed securely from Railway
client.login(process.env.token || config.token);
