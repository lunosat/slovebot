import dotenv from "dotenv";
dotenv.config();

import { Markup, Telegraf } from "telegraf";

import imdb from "./imdb.js";
import log from "./logger.js";

const initBot = (db) => {
  log.process("Initializing bot...");
  let chossing = {};
  let sorting = {};
  const bot = new Telegraf(process.env.TOKEN);

  bot.start((ctx) =>
    ctx.reply(
      `_Olá ${ctx.message.from.first_name}, se não for meu amorzinho pode se retirar, rummm_`, {parse_mode: 'MarkdownV2'}
    )
  );

  bot.command("add", async (ctx) => {
    let title = ctx.message.text.split(" ");
    title.shift();
    let finalTitle = title.length >= 2 ? title.join(" ") : title[0];
    if (!finalTitle || finalTitle === "/add")
      return ctx.replyWithMarkdownV2(
        "_Deve citar o filme, por exemplo:_ */add Velozes e furiosos*"
      );
    try {
      await ctx.replyWithMarkdownV2("_Buscando correspondências ⏳_");
      let data = await imdb(finalTitle);
      if (data.error)
        return ctx.reply(
          "_Houve um erro ao encontrar o conteúdo, oir favor tente novamente em alguns segundos_",
          { parse_mode: "MarkdownV2" }
        );
      let index = data.d[0].id === "/best-of" ? 1 : 0;
      data = data.d[index];

      // console.log(ctx.message.from);

      chossing[ctx.message.from.id] = {
        info: data,
        index,
        userTitle: finalTitle,
        addedBy: ctx.message.from.first_name,
        defined: false,
      };

      let caption = `*Título:* _${data.l}_

*Lançamento:* _${data.y}_

*Elenco principal:* _${data.s}_`;

      ctx.replyWithPhoto(
        { url: data.i.imageUrl },
        {
          caption: caption,
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            Markup.button.callback("✅", "yes"),
            Markup.button.callback("❌", "no"),
            Markup.button.callback("⏭", "next"),
          ]),
        }
      );
    } catch (e) {
      console.log(e);
    }
  });

  bot.command("filmes", async (ctx) => {
    let titles = await db.getFilmsTitles(true);
    let text = titles
      .map((film) => {
        return `*Título IMDB:* _${film.title}_
*Título pesquisado:* _${film.userTitle}_
*Adicionado por:* _${film.addedBy}_
*Assistido:* _${film.watched ? "Sim" : "Não"}_`;
      })
      .join("\n\n─── ･ ｡ﾟ☆: *\\.☽ \\.* :☆ﾟ\\. ───\n\n");
    ctx.reply(text, { parse_mode: "MarkdownV2" });
  });

  bot.command("sortear", async (ctx) => {
    ctx.replyWithMarkdownV2("_Fazendo uma escolha incrível\\.\\.\\._");
    const titles = await db.getFilmsTitles(false);
    const random = Math.floor(Math.random() * titles.length);
    const sorted = titles[random];

    sorting[ctx.message.from.id] = { title: sorted.title };

    let caption = `*Itém sorteado\!
    
*Título:* ${sorted.title}
*Título pesquisado:* ${sorted.userTitle}
*Adicionado por: ${sorted.addedBy}`;

    await ctx.replyWithPhoto(
      { url: sorted.imdbInfo.i.imageUrl },
      {
        caption: caption,
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.callback("👍🏼", "like"),
          Markup.button.callback("👎🏼", "dislike"),
          Markup.button.callback("🎲", "sort"),
        ]),
      }
    );
  });

  bot.action("like", async (ctx) => {
    await ctx.answerCbQuery();
    if (!sorting[ctx.from.id]?.title)
      return await ctx.replyWithMarkdownV2(
        "_Essa seleção expirou, solicite uma nova\\._"
      );
    db.turnWatched(sorting[ctx.from.id].title);

    ctx.replyWithMarkdownV2(
      `_Uuuu, ainda bem que gostamos, esse contéudo foi marcado como assistido amor\\._`
    );
    delete sorting[ctx.from.id];
    return;
  });

  bot.action("dislike", async (ctx) => {
    await ctx.answerCbQuery();
    if (!sorting[ctx.from.id]?.title)
      return await ctx.replyWithMarkdownV2(
        "_Essa seleção expirou, solicite uma nova\\._"
      );
    db.turnWatched(sorting[ctx.from.id].title);

    ctx.replyWithMarkdownV2(
      `_Poxa, que pena, pelo menos estavamos juntinhos mesmo com o filme sendo ruím o momento foi bom, esse conteúdo foi marcado como assistido\\._`
    );
    delete sorting[ctx.from.id];
    return;
  });

  bot.action("sort", async (ctx) => {
    ctx.replyWithMarkdownV2("_Fazendo uma escolha incrível\\.\\.\\._");
    const titles = await db.getFilmsTitles(false);
    const random = Math.floor(Math.random() * titles.length);
    const sorted = titles[random];

    sorting[ctx.from.id] = { title: sorted.title };

    let caption = `*Itém sorteado\!
    
*Título:* ${sorted.title}
*Título pesquisado:* ${sorted.userTitle}
*Adicionado por: ${sorted.addedBy}`;

    await ctx.replyWithPhoto(
      { url: sorted.imdbInfo.i.imageUrl },
      {
        caption: caption,
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.callback("👍🏼", "like"),
          Markup.button.callback("👎🏼", "dislike"),
          Markup.button.callback("🎲", "sort"),
        ]),
      }
    );
  });

  bot.action("yes", async (ctx) => {
    await ctx.answerCbQuery();
    if (!chossing[ctx.from.id]?.userTitle)
      return await ctx.replyWithMarkdownV2(
        "_Essa seleção expirou, solicite uma nova\\._"
      );
    let data = chossing[ctx.from.id];
    let info = {
      title: data?.info?.l,
      userTitle: data?.userTitle,
      imdbInfo: data?.info,
      addedBy: data?.addedBy,
      watched: false,
    };
    const status = await db.addFilm(info);
    if (status) {
      delete chossing[ctx.from.id];
      await ctx.reply(
        "_Itém adicionado com sucesso\\! Para ver todos use /filmes_",
        { parse_mode: "MarkdownV2" }
      );
    } else {
      await ctx.reply(
        "_Houve um erro ao adicionar o filme, entre em contato com seu amor e avise_",
        { parse_mode: "MarkdownV2" }
      );
    }
    return;
  });

  bot.action("no", async (ctx) => {
    delete chossing[ctx.from.id];
    await ctx.replyWithMarkdownV2("_Operação cancelada\\!_");
    return;
  });

  bot.action("next", async (ctx) => {
    await ctx.answerCbQuery();

    ctx.editMessageCaption("_Carregando próximo ⏳_", {
      parse_mode: "MarkdownV2",
    });

    let data = await imdb(chossing[ctx.from.id].userTitle);

    let index;

    if (chossing[ctx.from.id].index >= data.d.length) index = -1;
    else index = chossing[ctx.from.id].index += 1;
    data = data.d[index];
    chossing[ctx.from.id].info = data;

    let caption = `*Título:* _${data?.l ? data?.l : "Inexistente"}_

*Lançamento:* _${data?.y ? data?.y : "Inexistente"}_

*Elenco principal:* _${data?.s ? data?.s : "Inexistente"}_`;

    if (index === -1) {
      delete chossing[ctx.from.id];
      return ctx.replyWithMarkdownV2("_Fím da lista_");
    }
    await ctx.editMessageMedia(
      {
        type: "photo",
        media: data?.i?.imageUrl
          ? data.i.imageUrl
          : "https://cataas.com/cat/says/Ops...%20Desculpe%20amor,%20sem%20capa",
        caption,
        parse_mode: "Markdown",
      },
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.callback("✅", "yes"),
          Markup.button.callback("❌", "no"),
          Markup.button.callback("⏭", "next"),
        ]),
      }
    );
    return;
  });
  bot.launch();

  log.sucess("Bot initialized!");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};

export default initBot;
