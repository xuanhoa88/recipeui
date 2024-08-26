"use client";

import { useContext, useEffect, useMemo } from "react";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { RecipeParameterTab } from "./RecipeLeftPane/RecipeParameterTab";
import { RecipeTemplatesTab } from "./RecipeLeftPane/RecipeTemplates";
import { RecipeOutput } from "../RecipeOutput";
import {
  RecipeBodyRoute,
  RecipeContext,
  useRecipeSessionStore,
} from "../../state/recipeSession";
import { useIsMobile } from "../../hooks";

export function RecipeBody() {
  const bodyRoute = useRecipeSessionStore((state) => state.bodyRoute);

  // We should probably actually fetch the id here if possible?
  const selectedRecipe = useContext(RecipeContext);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const isMobile = useIsMobile();

  const routes = useMemo(() => {
    if (selectedRecipe === null) {
      return [];
    }

    const parameters = [RecipeBodyRoute.Parameters, RecipeBodyRoute.Templates];

    return parameters;
  }, [selectedRecipe]);

  useEffect(() => {
    if (isMobile) {
      setBodyRoute(RecipeBodyRoute.Templates);
    }
  }, [isMobile, setBodyRoute]);

  const router = useRouter();

  if (routes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex space-x-6 sm:p-4 sm:pt-2 pl-4 pb-4 sm:hidden">
        {routes.map((route) => {
          return (
            <div
              key={route}
              className={classNames(
                "font-bold text-sm",
                bodyRoute === route && "underline underline-offset-4",
                "cursor-pointer"
              )}
              onClick={() => setBodyRoute(route)}
            >
              {route}
            </div>
          );
        })}
        <div
          className={"font-bold text-sm cursor-pointer sm:hidden"}
          onClick={() => {
            router.push("/");
          }}
        >
          {"Home"}
        </div>
      </div>
      <div className="flex-1 border-t border-t-slate-200 dark:border-t-slate-600 sm:grid sm:grid-cols-2 flex flex-col overflow-x-auto">
        {bodyRoute === RecipeBodyRoute.Parameters && <RecipeParameterTab />}
        {bodyRoute === RecipeBodyRoute.Templates && <RecipeTemplatesTab />}
        {/* {bodyRoute === RecipeBodyRoute.Config && <RecipeConfigTab />} */}
        <RecipeOutput />
      </div>
    </>
  );
}
