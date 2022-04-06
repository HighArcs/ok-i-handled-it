import { Command } from "../../../command";

export default <Command>{
  name: "ok",
  metadata: {
    description: "yea",
  },
  async execute(context, args) {
    return await context.reply("ok");
  },
};
