Reading photos of bills (Purchases → Record expense / New bill → Read the invoice) — served from this folder, in the
browser only: the photo never leaves the browser to be read.

  tesseract.esm.min.js, worker.min.js     tesseract.js 7.0.0 (Apache-2.0, LICENSE-tesseract.js.md)
  tesseract-core-simd-lstm.wasm.js        tesseract.js-core 7.0.0, the LSTM engine for browsers with WebAssembly SIMD
                                          (Apache-2.0, LICENSE-tesseract.js-core.txt)
  eng.traineddata.gz                      English, @tesseract.js-data/eng 1.0.0 (4.0.0_best_int; Tesseract's
                                          tessdata_best, Apache-2.0)

Copied as published on npm; nothing changed. PDFs with text are read with pdf.js (../pdfjs), e-invoice QR codes
with jsQR (in the app's own bundle).
