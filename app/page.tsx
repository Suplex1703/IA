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
          <h1 className="text-3xl font-semibold cursor-pointer">Image 2 Code</h1>
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
									<path
										d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
										fill="currentColor"
									/>
									<path
										d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
										fill="currentFill"
									/>
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
