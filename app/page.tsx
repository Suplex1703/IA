"use client";
import { useState } from "react";
import { Form } from "./form";
import { DragAndDrop } from "./draganddrop";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

const STEPS = {
  INITIAL: "INITIAL",
  LOADING: "LOADING",
  PREVIEW: "PREVIEW",
  ERROR: "ERROR",
};

const toBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

async function* streamReader(res: Response) {
  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (reader == null) return;

  while (true) {
    const { done, value } = await reader.read();
    const chunk = decoder.decode(value);
    yield chunk;
    if (done) break;
  }
}

export default function Home() {
  const [result, setResult] = useState("");
  const [step, setStep] = useState(STEPS.INITIAL);
  const [copySuccess, setCopySuccess] = useState(false);

  const transformToCode = async (body: string) => {
    setStep(STEPS.LOADING);
    const res = await fetch("/api/genera-imagen-codigo", {
      method: "POST",
      body,
      headers: {
        "Content-type": "application/json",
      },
    });

    if (!res.ok || res.body == null) {
      setStep(STEPS.ERROR);
      throw new Error("Error al generar el codigo");
    }

    setStep(STEPS.PREVIEW);

    // leer el streaming de datos
    for await (const chunk of streamReader(res)) {
      setResult((prev) => prev + chunk);
    }
  };

  const tranfromImageToCode = async (file: File) => {
    const img = await toBase64(file);
    await transformToCode(JSON.stringify({ img }));
  };

  const transformUrlToCode = async (url: string) => {
    await transformToCode(JSON.stringify({ url }));
  };

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopySuccess(true);

      // Clear copy success message after a short delay
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error al copiar al portapapeles", error);
      setCopySuccess(false);
    }
  };

  const [background, html = ""] = result.split("|||");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[400px_1fr]">
      <aside className="md:flex md:flex-col md:justify-between md:min-h-screen md:p-4 bg-gray-900">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">Image 2 Code</h1>
          <h2 className="text-sm opacity-75">Pasa tus imágenes a código</h2>
        </header>
        <section>{/* Aquí irán los filtros */}</section>
      </aside>

      <main className="bg-gray-950">
        <section className="max-w-full md:max-w-5xl mx-auto p-4 md:p-10">
          {step === STEPS.LOADING && (
            <div className="flex justify-center items-center">
              <div role="status">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* ... SVG de carga ... */}
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          {step === STEPS.INITIAL && (
            <div className="flex flex-col gap-4">
              <DragAndDrop tranfromImageToCode={tranfromImageToCode} />
              <Form transformUrlToCode={transformUrlToCode} />
            </div>
          )}

          {step === STEPS.PREVIEW && (
            <div className="rounded flex flex-col gap-4">
              <div
                className="w-full h-full border-4 rounded border-gray-700 aspect-video"
                style={{
                  backgroundColor: `#${background ? background.trim() : "fff"}`,
                }}
              >
                <iframe srcDoc={html} className="w-full h-full" />
              </div>
              <div className="md:flex md:items-center md:justify-end p-2 rounded ml-auto md:ml-auto">
                <button
                  className="text-white px-4 py-2 rounded focus:outline-none"
                  onClick={handleCopyClick}
                >
                  <FontAwesomeIcon icon={faCopy} className="mr-2" />
                  {copySuccess ? "👍" : ""}
                </button>
              </div>
              <div className="flex items-center justify-between overflow-x-auto ">
                <pre className="pt-10 whitespace-pre-wrap">
                  <code>{html}</code>
                </pre>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
