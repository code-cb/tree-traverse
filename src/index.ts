export type GetChildren<Node> = (node: Node) => Iterable<Node>;
export type GetResult<Node, Result> = (node: Node, parent: Node) => Result;
export type TraversalType = 'breadth-first' | 'pre-order' | 'post-order';
export type TraversalGeneratorFunction<Node, Result = Node> = (
  root: Node,
) => Generator<Result>;

export const createTraverse = <Node, Result>(
  getChildren: GetChildren<Node>,
  getResult: GetResult<Node, Result>,
  defaultType: TraversalType = 'pre-order',
) => {
  type Traverse = TraversalGeneratorFunction<Node, Result>;

  const traverseBreadthFirstImpl = function* (
    queue: Node[],
  ): Generator<Result> {
    const root = queue.shift();
    if (!root) return;
    for (const child of getChildren(root)) {
      yield getResult(child, root);
      queue.push(child);
    }
    yield* traverseBreadthFirstImpl(queue);
  };

  const traverseBreadthFirst: Traverse = function* (root) {
    const queue = [root];
    yield* traverseBreadthFirstImpl(queue);
  };

  const traversePostOrder: Traverse = function* (root) {
    for (const child of getChildren(root)) {
      yield* traversePostOrder(child);
      yield getResult(child, root);
    }
  };

  const traversePreOrder: Traverse = function* (root) {
    for (const child of getChildren(root)) {
      yield getResult(child, root);
      yield* traversePreOrder(child);
    }
  };

  const traversalFunctions: Record<TraversalType, Traverse> = {
    'breadth-first': traverseBreadthFirst,
    'post-order': traversePostOrder,
    'pre-order': traversePreOrder,
  };

  return (root: Node, type = defaultType): Iterable<Result> =>
    (traversalFunctions[type] ?? traversalFunctions[defaultType])(root);
};
