// import { executeCode } from '../executeCode.mjs';

import { executeCode } from "../utils/executeCode.js";

export const runCode = async (req, res) => {
  const { language, code, input } = req.body;

  console.log(req.body)

  try {
    const result = await executeCode(language, code, input);

    console.log("===================================",result)
    res.json({ output: result });
  } catch (error) {
    res.status(500).json({ error: 'Error executing code', details: error.message });
  }
};
