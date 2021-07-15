//hardhat script
// are you sure you want to add / remove:
// print all addresses
// point to a JSON file from CLI args
// add / remove as CLI flag
// address from env var
// check address exists
  // Presale.addToWhitelistMulti()
  // Presale.removeFromWhitelistMulti()
module.exports = async (args) => {
  let ok = await yesno({ question: `Are you sure you want to whitelist <addresses> on ${hre.network.name} against Presale contract <address> (y/n)?` });
  if (!ok) {
    return;
  }

};
