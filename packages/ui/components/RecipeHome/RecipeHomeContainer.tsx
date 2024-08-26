"use client";

import { useEffect, useMemo } from "react";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";
import { Recipe, RecipeProject, UserTemplatePreview } from "types/database";
import {
  RecipeContext,
  RecipeNativeFetchContext,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { RecipeHome } from "./RecipeHome";
import { UNIQUE_ELEMENT_IDS } from "../../utils/constants/main";
import { fetchServer } from "../RecipeBody/RecipeBodySearch/fetchServer";
import { useLocalProjects } from "../../state/apiSession/RecipeUICollectionsAPI";

export function RecipeHomeContainer({
  projects,
  recipe,
  sharedTemplate,
}: {
  projects: RecipeProject[];
  recipe?: Recipe;
  sharedTemplate?: UserTemplatePreview;
}) {
  const router = useRouter();

  const globalProjects = useLocalProjects();

  const [localForked, setLocalForked] = useLocalStorage(
    UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
    ""
  );

  const user = useRecipeSessionStore((state) => state.user);
  useEffect(() => {
    if (user && localForked) {
      if (localForked === sharedTemplate?.alias) {
        location.reload();
      } else {
        router.push(`/r/${localForked}`);
      }

      setLocalForked("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localForked, router, setLocalForked, user]);

  const project = useMemo(() => {
    const searchRecipe = recipe ?? sharedTemplate?.recipe;

    return searchRecipe
      ? projects.find((p) => p.project === searchRecipe?.project) ||
          globalProjects.find((p) => p.project === searchRecipe?.project)
      : null;
  }, [globalProjects, projects, recipe, sharedTemplate?.recipe]);

  return (
    <>
      <div className={classNames("flex-1 flex flex-col m-6 sm:m-8")}>
        <RecipeContext.Provider value={recipe || null}>
          <RecipeProjectContext.Provider value={project || null}>
            <RecipeNativeFetchContext.Provider value={fetchServer}>
              <RecipeHome projects={projects} />
            </RecipeNativeFetchContext.Provider>
          </RecipeProjectContext.Provider>
        </RecipeContext.Provider>
      </div>
    </>
  );
}
