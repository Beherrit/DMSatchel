// Late-bound links between the shared world and the generators, so neither has to load the other up front:
// the world store fills these in, and the Forge and the magic item rolls read them when they run.
export const hooks = {
  characterLibrary: () => ({}),
  libraryItems: () => [],
};
