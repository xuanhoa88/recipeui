import { ReactNode, useContext, useMemo, useState } from "react";
import classNames from "classnames";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import CodeMirror, { BasicSetupOptions } from "@uiw/react-codemirror";
import { useDarkMode } from "usehooks-ts";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import xmlFormat from "xml-formatter";
import { imageRegex } from "utils/constants/regex";
import { Recipe, RecipeOutputType } from "types/database";
import {
  RecipeContext,
  SessionOutput,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useOutput } from "../../state/apiSession/OutputAPI";
import { RecipeSaveButton } from "../RecipeBody/RecipeBodySearch/RecipeSaveButton";
import { Modal } from "../Modal";

const codeMirrorSetup: BasicSetupOptions = {
  lineNumbers: true,
  highlightActiveLine: false,
};

export function RecipeOutputConsole() {
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const sessionOutput = useOutput(currentSession?.id);
  const {
    output: { output, type },
  } = sessionOutput;

  const isSending = useRecipeSessionStore((state) => state.isSending);
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const selectedRecipe = useContext(RecipeContext);
  const { imageBlocks, codeBlocks } = useMemo(() => {
    // Even though we can match on this, it's not good because stringify removes some whitespace
    const codeBlockRegex = /```(.*?)```/gs;

    const codeBlocks: string[] = [];
    const imageBlocks: string[] = [];

    function checkObjs(obj: Record<string, unknown>) {
      Object.values(obj).forEach((value) => {
        if (typeof value === "object") {
          checkObjs((value || {}) as Record<string, unknown>);
        } else if (typeof value === "string") {
          // We'll ocassionally hardcode edgecases. Unsplash doesn't have standardized image urls
          if (value.includes("images.unsplash")) {
            imageBlocks.push(value);
          } else if (value.startsWith("https://preview.redd.it/")) {
            // Blacklist this website.
            return;
          }

          const codeBlockMatch = value
            .match(codeBlockRegex)
            ?.map((match) => match.replace(/```/g, ""));
          if (codeBlockMatch) codeBlocks.push(...codeBlockMatch);

          const imageMatch = value.match(imageRegex);

          if (imageMatch) imageBlocks.push(...imageMatch);
        }
      });
    }
    checkObjs(output);

    return { codeBlocks, imageBlocks };
  }, [output]);

  return (
    <div className="sm:absolute inset-0 px-4 py-8 overflow-y-auto right-pane-bg space-y-6">
      {imageBlocks.length > 0 && (
        <>
          <OutputModule
            title="Images Found"
            tooltip="We found these image URLs from the response."
            loading={!!loadingTemplate}
            body={
              <>
                {imageBlocks.length > 1 && (
                  <p className="mb-2">
                    We found {imageBlocks.length} images. Scroll left and right
                    to see some of them.
                  </p>
                )}
                <div className="carousel rounded-box">
                  {imageBlocks.map((imageUrl, i) => {
                    if (i > 30) return null;

                    return (
                      <img
                        src={imageUrl}
                        key={imageUrl + i}
                        alt={imageUrl}
                        className="carousel-item rounded-md max-h-48 object-contain"
                      />
                    );
                  })}
                </div>
              </>
            }
          />
        </>
      )}
      {codeBlocks.length > 0 && (
        <OutputModule
          title="Code Blocks Found"
          loading={!!loadingTemplate}
          tooltip="We found these code snippets from the response."
          body={
            <div
              className={classNames(
                loadingTemplate ? "flex flex-col-reverse gap-y-4" : "space-y-4"
              )}
            >
              {codeBlocks.map((codeBlock, i) => {
                return (
                  <div className="mockup-code text-sm" key={i}>
                    <pre className="px-8 whitespace-pre-wrap">
                      <code className="">{codeBlock}</code>
                    </pre>
                  </div>
                );
              })}
            </div>
          }
        />
      )}
      {!isSending || (isSending && type === RecipeOutputType.Streaming) ? (
        <>
          <OutputModule
            title="Response"
            responseInfo={sessionOutput.output.responseInfo}
            body={
              <>
                {Object.keys(output).length > 0 ? (
                  <ResponseOutput
                    sessionOutput={sessionOutput.output}
                    selectedRecipe={selectedRecipe}
                  />
                ) : null}
              </>
            }
          />
        </>
      ) : (
        <div className="flex items-end mb-2">
          <h1 className="text-xl font-bold">Fetching response</h1>
          <span className="loading loading-bars loading-md  ml-2"></span>
        </div>
      )}
    </div>
  );
}

export function ResponseOutput({
  selectedRecipe,
  sessionOutput,
}: {
  selectedRecipe?: Recipe | null;
  sessionOutput: SessionOutput;
}) {
  const extensions = useMemo(() => {
    if (
      selectedRecipe?.options?.streaming ||
      sessionOutput.contentType?.includes("text")
    ) {
      return [markdown()];
    } 
    if (sessionOutput.contentType?.includes("xml")) {
      return [xml()];
    }
    return [json()];
  }, [selectedRecipe?.options?.streaming, sessionOutput.contentType]);

  const output = useMemo(() => {
    let _output = "";

    if (selectedRecipe?.options?.streaming) {
      if (sessionOutput.output["content"] as string) {
        _output = sessionOutput.output["content"] as string;
      } else {
        _output = JSON.stringify(_output, null, 2);
      }
    } else if (
      sessionOutput.contentType?.includes("text") &&
      sessionOutput.output["text"]
    ) {
      _output = sessionOutput.output["text"] as string;
    } else if (
      sessionOutput.contentType?.includes("xml") &&
      sessionOutput.output["xml"]
    ) {
      _output = xmlFormat(sessionOutput.output["xml"] as string);
    } else {
      _output = JSON.stringify(sessionOutput.output, null, 2);
    }

    return _output;
  }, [
    selectedRecipe?.options?.streaming,
    sessionOutput.contentType,
    sessionOutput.output,
  ]);

  const { isDarkMode } = useDarkMode();

  const { contentType } = sessionOutput;

  return (
    <>
      {contentType?.includes("text/html") && <HTMLPreview html={output} />}

      <CodeMirror
        readOnly={true}
        value={output}
        maxHeight="100vh"
        className="h-full !outline-none border-none max-w-sm sm:max-w-none"
        basicSetup={codeMirrorSetup}
        theme={isDarkMode ? "dark" : "light"}
        extensions={extensions}
      />
    </>
  );
}

function HTMLPreview({ html }: { html: string }) {
  const [showPreview, setShowPreview] = useState(false);
  const editorUrl = useRecipeSessionStore((state) => state.editorUrl);

  return (
    <div>
      {!showPreview ? (
        <div className="border mb-4 p-4">
          <p className="text-sm">
            Do you want to render the HTML from the response below?
          </p>
          <button
            className="btn btn-neutral btn-xs mt-2"
            onClick={() => {
              setShowPreview(true);
            }}
          >
            Preview
          </button>
        </div>
      ) : (
        <div className="mockup-browser bg-base-300 mb-4 overflow-x-scroll">
          <div className="mockup-browser-toolbar">
            <div className="input">{editorUrl}</div>
          </div>
          <iframe srcDoc={html} className="w-full h-full  min-h-[400px]" />
        </div>
      )}
    </div>
  );
}

function OutputModule({
  title,
  body,
  tooltip,
  loading,
  responseInfo,
}: {
  title: string;
  body: ReactNode;
  tooltip?: string;
  loading?: boolean;
  responseInfo?: SessionOutput["responseInfo"];
}) {
  return (
    <div className="">
      <div className="flex items-center mb-2">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-black dark:text-white">
            {title}
          </h1>
          {responseInfo && (
            <>
              <RecipeSaveButton />
              <ResponseInfo responseInfo={responseInfo} />
            </>
          )}
        </div>
        {tooltip && (
          <span
            className="tooltip tooltip-bottom tooltip-accent ml-2"
            data-tip={tooltip}
          >
            <InformationCircleIcon className="w-5 h-5" />
          </span>
        )}
        {loading && <span className="loading loading-bars ml-2"></span>}
      </div>
      {body}
    </div>
  );
}

export function ResponseInfo({
  responseInfo,
}: {
  responseInfo: NonNullable<SessionOutput["responseInfo"]>;
}) {
  const [showHeaders, setShowHeaders] = useState(false);

  return (
    <>
      <button
        className={classNames("text-white !pointer-events-none", {
          "btn btn-xs btn-accent":
            responseInfo.status >= 200 && responseInfo.status < 300,
          "btn btn-xs btn-error":
            responseInfo.status >= 400 && responseInfo.status < 500,
          "btn btn-xs btn-warning":
            responseInfo.status >= 500 && responseInfo.status < 600,
        })}
      >
        {responseInfo.status}{" "}
        {responseInfo.status >= 200 && responseInfo.status < 300 ? "OK" : ""}
      </button>
      {responseInfo.headers && Object.keys(responseInfo.headers).length > 0 && (
        <button
          className="btn btn-outline btn-xs tooltip text-black dark:text-white pointer-events-none"
          data-tip="View response headers"
          onClick={() => setShowHeaders(true)}
        >
          Headers
        </button>
      )}
      <button
        className={classNames(
          "btn-outline btn btn-xs text-black dark:text-white pointer-events-none"
        )}
      >
        {responseInfo.duration.toFixed(2)} ms
      </button>
      {showHeaders && (
        <HeadersModal
          headers={responseInfo.headers}
          onClose={() => setShowHeaders(false)}
        />
      )}
    </>
  );
}

function HeadersModal({
  onClose,
  headers,
}: {
  headers: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <Modal header="" onClose={onClose}>
      <div className="overflow-x-auto">
        <table className="table table-zebra table-pin-rows">
          <thead className="">
            <tr className="grid grid-cols-2">
              <th>Header</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(headers).map(([key, value]) => {
              return (
                <tr key={key} className="grid grid-cols-2 overflow-x-auto">
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
