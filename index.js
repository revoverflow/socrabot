const SocrativeClient = require('./core/SocrativeClient');
var client = new SocrativeClient("SOCRATIVE", "Developer");

(async () => {
    await client.joinRoom();
    client.doQuestions();
})();