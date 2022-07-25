export type GetChildren<Node> = (node: Node) => Iterable<Node>;
export interface TraverseResult<Node> {
  node: Node;
  parent: Node;
  skipChildren: () => void;
}
export type GetResult<Node, Result> = (result: TraverseResult<Node>) => Result;
export type TraversalType = 'breadth-first' | 'depth-first';

type TraversalGeneratorFunction<Node, Result = Node> = (
  root: Node,
) => Generator<Result>;

type TraverseFunction<Node, Result = TraverseResult<Node>> = (
  root: Node,
  type?: TraversalType,
) => Iterable<Result>;

const createTraverseImpl = <Node, Result>(
  getChildren: GetChildren<Node>,
  getResult: GetResult<Node, Result>,
  defaultType: TraversalType = 'depth-first',
): TraverseFunction<Node, Result> => {
  type Traverse = TraversalGeneratorFunction<Node, Result>;
  type YieldResult = TraverseResult<Node>;

  const traverseBreadthFirstImpl = function* (
    queue: Node[],
  ): Generator<Result> {
    const root = queue.shift();
    if (!root) return;
    for (const child of getChildren(root)) {
      let shouldSkip = false;
      const result: YieldResult = {
        node: child,
        parent: root,
        skipChildren: () => (shouldSkip = true),
      };
      yield getResult(result);
      if (!shouldSkip) queue.push(child);
    }
    yield* traverseBreadthFirstImpl(queue);
  };

  const traverseBreadthFirst: Traverse = function* (root) {
    const queue = [root];
    yield* traverseBreadthFirstImpl(queue);
  };

  const traverseDepthFirst: Traverse = function* (root) {
    for (const child of getChildren(root)) {
      let shouldSkip = false;
      const result: YieldResult = {
        node: child,
        parent: root,
        skipChildren: () => (shouldSkip = true),
      };
      yield getResult(result);
      if (!shouldSkip) yield* traverseDepthFirst(child);
    }
  };

  const traversalFunctions: Record<TraversalType, Traverse> = {
    'breadth-first': traverseBreadthFirst,
    'depth-first': traverseDepthFirst,
  };

  return (root, type = defaultType) =>
    (traversalFunctions[type] ?? traversalFunctions[defaultType])(root);
};

export function createTraverse<Node>(
  getChildren: GetChildren<Node>,
  defaultType?: TraversalType,
): TraverseFunction<Node>;
export function createTraverse<Node, Result>(
  getChildren: GetChildren<Node>,
  getResult: GetResult<Node, Result>,
  defaultType?: TraversalType,
): TraverseFunction<Node, Result>;
export function createTraverse<Node, Result = TraverseResult<Node>>(
  getChildren: GetChildren<Node>,
  arg1?: GetResult<Node, Result> | TraversalType,
  arg2?: TraversalType,
): TraverseFunction<Node, Result> {
  const hasGetResult = typeof arg1 === 'function';
  const getResult = hasGetResult
    ? arg1
    : (result: TraverseResult<Node>) => result as unknown as Result;
  const defaultType = (hasGetResult ? arg2 : arg1) || 'depth-first';
  return createTraverseImpl(getChildren, getResult, defaultType);
}
