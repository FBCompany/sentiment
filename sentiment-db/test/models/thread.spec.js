// Testing libraries
let chai = require('chai');
let expect = chai.expect;
let chaiHttp = require('chai-http');
chai.use(chaiHttp);

// Helpers
let moment = require('moment');
let seeder = require('../helpers/seeder.js');

// App requires
let server = require('../../server.js');
let mongoose = require('mongoose');
let Thread = require('../../models/thread');

describe('thread', function () {
  beforeEach('drop the collection and reseed database', function(done){
    mongoose.connection.collections.threads.drop(function () {
      seeder.threads(done)
    });        
  });

  it('should return all the threads on GET /threads', function (done) {
    chai.request(server)
      .get('/threads')
      .end(function (err, resp) {
        let input = resp.body.map(el => {
          return Object.assign({}, {
            topic: el.topic,
            createdAt: moment(el.createdAt).format('MMMM YYYY')
          })
        })
        let actual = [
          {topic: 'bitcoin', createdAt: 'October 2017'},
          {topic: 'gold', createdAt: 'October 2017' },
          {topic: 'monero', createdAt: 'October 2017' }
        ]
        expect(input).to.deep.include.members(actual);                
        done();
      })
  });

  it('should add a single thread on POST /threads', function (done) {
    let posts = require('../data/posts.json');

    chai.request(server)
      .post('/threads')
      .send({topic: 'banana boat', posts})
      .end(function (err, resp) {
        let data = resp.body;
        let topic = data.topic;
        let date = moment(data.date).format('MMMM YYYY');
        let today = moment().format('MMMM YYYY');
        expect(topic).to.equal('banana boat');
        expect(date).to.equal(today);
        expect(data.posts.posts.length).to.equal(23);
        done();
      })
  });

  it('should return all topic threads on GET /threads/topic/:topic', function (done) {
    chai.request(server)
      .get('/threads/topic/bitcoin')
      .end(function (err, resp) {
        let input = resp.body.map(el => {
          return Object.assign({}, {
            topic: el.topic,
            createdAt: moment(el.createdAt).format('MMMM YYYY')
          })
        })
        let actual = [
          { topic: 'bitcoin', createdAt: 'October 2017' },
          { topic: 'bitcoin', createdAt: 'October 2017' },
        ]
        expect(input).to.deep.include.members(actual);
        done();
      })
  });

  it('should return the latest topic thread on GET /threads/topic/:topic/latest', function (done) {
    chai.request(server)
      .get('/threads/topic/bitcoin/latest')
      .end(function (err, resp) {
        expect(resp.body.length).to.equal(1);        
        let data = resp.body[0];        
        let topic = data.topic;
        let posts = data.posts.posts;
        expect(topic).to.equal('bitcoin');
        expect(posts.length).to.equal(23);
        done();
      })
  });

  it('should delete a topic by id on DELETE /threads/topic/id/:id', function (done) {
    Thread
      .findOne({topic: 'bitcoin' })
      .then(data => {
        let id = data.id;
        chai.request(server)
          .delete(`/threads/topic/id/${id}`)
          .end(function (err, resp) {
            expect(resp.body.topic).to.equal('bitcoin');
            chai.request(server)
              .get('/threads/topic/bitcoin')
              .end(function( err, resp){
                expect(resp.body.length).to.equal(1);
                done();
              })
          })
      })
  });
})
