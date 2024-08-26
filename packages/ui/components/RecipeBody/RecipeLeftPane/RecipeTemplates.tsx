import { useContext, useState } from "react";
import { RecipeTemplate, UserTemplatePreview } from "types/database";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import { usePostHog } from "posthog-js/react";
import { RECIPE_FORKING_ID } from "utils/constants";
import { useSessionStorage } from "usehooks-ts";
import { ProjectScope } from "types/enums";
import {
  DesktopPage,
  RecipeContext,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { RecipeTemplateEdit } from "./RecipeTemplateEdit";
import { RecipeForkTab } from "./RecipeForkTab";

export function RecipeTemplatesTab() {
  const editorMode = useRecipeSessionStore((state) => state.editorMode);

  if (editorMode) {
    return <RecipeTemplateEdit />;
  }

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto space-y-8">
        <StarterTemplates />
      </div>
    </div>
  );
}

export function StarterTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const templates = selectedRecipe.templates || [];

  // eslint-disable-next-line no-unused-vars
  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const isTauri = useIsTauri();
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold">Fork API</h1>
        <p className="mt-2">
          This API does not have any sample recipes. Fork it directly to play
          with it!
        </p>
        <button
          className="btn btn-neutral btn-sm mt-4"
          onClick={() => {
            setRecipeFork(`${selectedRecipe.id}`);

            if (isTauri) {
              setDesktopPage({
                page: DesktopPage.Editor,
              });
            } else {
              router.push(`/editor`);
            }
          }}
        >
          Fork
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Example Recipes</h1>
      <p className="mt-2">Use the example below to see how to use this API.</p>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {templates.map((template) => (
          <StarterTemplateItem key={template.title} template={template} />
        ))}
      </div>
    </div>
  );
}

function StarterTemplateItem({ template }: { template: RecipeTemplate }) {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const selectedRecipe = useContext(RecipeContext)!;
  const posthog = usePostHog();

  const isTauri = useIsTauri();
  // eslint-disable-next-line no-unused-vars
  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);

  const [loading, setLoading] = useState(false);
  const [showForkModal, setShowForkModal] = useState(false);

  return (
    <>
      <div className="border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default">
        <h3 className="font-bold">{template.title}</h3>
        <p className="text-sm line-clamp-3">{template.description}</p>
        <div className="flex-1" />
        <div className="flex space-x-2">
          <button
            className={classNames(
              "btn btn-sm btn-neutral w-fit",
              loadingTemplate && "btn-disabled"
            )}
            onClick={async () => {
              posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
                template_id: "Core" + template.title,
                template_project: selectedRecipe.project,
                recipe_id: selectedRecipe.id,
                recipe_path: selectedRecipe.path,
              });
              setLoadingTemplate(template);
            }}
          >
            Simulate
          </button>
          <button
            className={classNames(
              "btn btn-sm btn-neutral",
              (loadingTemplate || loading) && "btn-disabled"
            )}
            onClick={async () => {
              // If this is desktop, then we just fork directly, if this is web then we redirect them to the fork tab

              if (isTauri) {
                setLoading(true);

                try {
                  if (isTauri) {
                    setRecipeFork(`${selectedRecipe.id}::${template.title}`);
                    setDesktopPage({
                      page: DesktopPage.Editor,
                    });
                  }
                } catch (e) {}
                setLoading(false);
              } else {
                setShowForkModal(true);
              }
            }}
          >
            Fork
            {loading && (
              <span className="loading loading-bars loading-sm"></span>
            )}
          </button>
        </div>
      </div>
      {showForkModal && (
        <RecipeForkTab
          onClose={() => {
            setShowForkModal(false);
          }}
          template={template}
        />
      )}
    </>
  );
}

export function TemplateMockCode({
  template,
  isTeam: _isTeam,
}: {
  template: UserTemplatePreview;
  isTeam?: boolean;
}) {
  const project = useContext(RecipeProjectContext);
  const isTeam = _isTeam || project?.scope === ProjectScope.Team;

  const label = isTeam
    ? `${project ? project.title : "Team"} | ${template.recipe.title}`
    : `${template.recipe.project} | ${template.recipe.title}`;

  return (
    <div className="mockup-code h-full w-full">
      <pre className="px-4 py-2 whitespace-pre-wrap">
        <p className="text-xs font-bold">{label}</p>
        <p className="text-xs font-bold">
          Created by @{template.original_author.username}
        </p>

        <div className="flex-1 mt-8">
          <h3 className="font-bold text-lg">{template.title}</h3>
          <p className="text-sm ">{template.description}</p>
        </div>
      </pre>
    </div>
  );
}
