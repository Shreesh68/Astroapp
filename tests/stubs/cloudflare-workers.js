// Stand-in for the Workers runtime module when tests import the chat server
export class DurableObject {
  constructor(ctx, env) { this.ctx = ctx; this.env = env }
}
