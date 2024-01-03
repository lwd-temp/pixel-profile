// @ts-check
import {
  kFormatter,
} from "../common/utils.js";
import satori from "satori";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { template } from "../../template/index.js";
import { Resvg } from "@resvg/resvg-js";
import axios from "axios";
import Jimp from "jimp";
import { genResultConvert } from "./genWebglConvertResult.js";
import { genAvatarConvert } from "./genWebglConvertAvatar.js";

/**
 * @typedef {import('../fetchers/types').StatsData} StatsData
 * @typedef {import('./types').StatCardOptions} StatCardOptions
 */

const avatarConvert = genAvatarConvert(280, 280);

async function getBitmapFromPngBuffer(dataBuffer) {
  const image = await Jimp.read(dataBuffer);

  const width = image.getWidth();
  const height = image.getHeight();
  const pixelBuffer = Buffer.alloc(width * height * 4);

  image.scan(0, 0, width, height, (x, y, idx) => {
    pixelBuffer[idx] = image.bitmap.data[idx];
    pixelBuffer[idx + 1] = image.bitmap.data[idx + 1];
    pixelBuffer[idx + 2] = image.bitmap.data[idx + 2];
    pixelBuffer[idx + 3] = image.bitmap.data[idx + 3];
  });

  return pixelBuffer;
}

/**
 * gen base64 img data
 *
 * @param {string} avatarUrl s
 * @returns {Promise<string>} base64 data
 */
async function genAvatarData(avatarUrl) {
  const response = await axios.get(avatarUrl, {
    responseType: "arraybuffer",
  });

  const dataBuffer = Buffer.from(response.data, "binary");

  const pixels = await getBitmapFromPngBuffer(dataBuffer);

  // const imgUrl = `data:image/png;base64,${dataBuffer.toString("base64")}`;
  // console.log('avatar img', imgUrl)
  //
  // return imgUrl

  const base64 = await avatarConvert({
    width: 280,
    height: 280,
    data: pixels,
  });

  // console.log('base64', base64)

  return base64;
}

/**
 * Renders the stats card.
 *
 * @param {StatsData} stats The stats data.
 * @param {Partial<StatCardOptions>} options The card options.
 * @returns {Promise<string>} The stats card SVG object.
 */
const renderStatsCard = async (stats, options = {}) => {
  const {
    name,
    totalStars,
    totalCommits,
    totalIssues,
    totalPRs,
    avatarUrl,
    contributedTo,
    rank,
  } = stats;

  const width = 1220;
  const height = 460;

  const fontPath = join(process.cwd(), "fonts", "PressStart2P-Regular.ttf");

  const [fontData, imgUrl] = await Promise.all([
    readFile(fontPath),
    genAvatarData(avatarUrl),
  ]);

  const _stats = {
    name,
    imgUrl,
    totalStars: kFormatter(totalStars),
    totalCommits: kFormatter(totalCommits),
    totalIssues: kFormatter(totalIssues),
    totalPRs: kFormatter(totalPRs),
    contributedTo: kFormatter(contributedTo),
    rank,
  };

  const svg = await satori(template(_stats), {
    width,
    height,
    fonts: [
      {
        name: "Roboto",
        data: fontData,
        weight: 400,
        style: "normal",
      },
    ],
  });

  const opts = {
    fitTo: {
      mode: "width",
      value: width,
    },
  };

  const resvg = new Resvg(svg, opts);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const convert = genResultConvert(width, height);

  const { width: _width, height: _height, pixels } = pngData;

  return await convert({ width: _width, height: _height, data: pixels });
};

export { renderStatsCard };
export default renderStatsCard;