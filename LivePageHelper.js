class LivePageHelper {
  constructor(client, set, params = {}, options = {}) {
    this.client = client;
    this.PageHelper = this.repaginate(set, params, options);
    this.paginateOps = (paginate) => paginate;
  }

  repaginate(set, params = {}, options = {}) {
    const self = this;
    this.PageHelper = this.client.paginate(set, params, options);
    return self;
  }

  map(lambda) {
    const self = this;
    let prevPaginateOps = this.paginateOps;
    this.paginateOps = (paginate) => prevPaginateOps(paginate).map(lambda);
    return self;
  }

  filter(lambda) {
    const self = this;
    let prevPaginateOps = this.paginateOps;
    this.paginateOps = (paginate) => prevPaginateOps(paginate).filter(lambda);
    return self;
  }

  each(lambda) {
    return this.paginateOps(this.PageHelper).each(lambda);
  }
}

module.exports = LivePageHelper;
