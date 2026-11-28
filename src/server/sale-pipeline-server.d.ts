export function createSalePipelineHandler(
  isAdmin: (request: Request) => boolean | Promise<boolean>,
): (request: Request) => Promise<Response>;

export function receiveSaleSnapshot(request: Request): Promise<Response>;
