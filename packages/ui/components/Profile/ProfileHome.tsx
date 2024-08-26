"use client";

import { useRouter } from "next/navigation";
import { RecipeProject, User, UserTemplatePreview } from "types/database";
import { TemplateMockCode } from "../RecipeBody/RecipeLeftPane/RecipeTemplates";

export function ProfileHome({
  profile,
  templates,
  projects,
}: {
  templates: UserTemplatePreview[];
  profile: Pick<User, "profile_pic" | "first" | "last" | "username">;
  projects: RecipeProject[];
}) {
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center space-x-2 justify-center">
        <h1 className="text-xl font-bold">
          @{profile.username} has nothing to show yet
        </h1>
        <button
          className="btn btn-accent btn-lg mt-2"
          onClick={() => {
            router.push("/");
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4">
      <div className="rounded-md ">
        <h2 className="font-bold text-3xl">{`@${profile.username}`}</h2>
      </div>
      <div className="mt-12">
        <h3 className="font-bold text-2xl mb-4">
          Recipes built in {projects.length} different API projects.
        </h3>
        <div className="flex flex-wrap space-x-4">
          {projects.map((projectInfo) => {
            return (
              <div
                className="flex justify-center flex-col items-center"
                key={projectInfo.id}
              >
                {projectInfo.image ? (
                  <img
                    className="object-cover w-[100px] h-[100px]"
                    src={projectInfo.image}
                    alt={projectInfo.title}
                  />
                ) : (
                  <div className="w-[100px] h-[100px] bg-accent shadow-sm font-bold flex justify-center items-center text-center rounded-md">
                    {projectInfo.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-12">
        <h2 className="text-2xl font-bold">
          Cookbook with {templates.length} recipes!
        </h2>
        <div className="projects-home-container">
          {templates.map((template) => {
            return (
              <div
                key={template.id}
                className="cursor-pointer h-full"
              >
                <TemplateMockCode key={template.id} template={template} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
