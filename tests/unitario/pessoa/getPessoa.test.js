var assert = require("assert");
const { conectar } = require('../connect_pg');
const { resetDb, createDb } = require('../resetDB');

let cliente;

describe("Get Pessoas", function () {
  before(function (done) {
    cliente = conectar()
    done();
  });
  after(function (done) {
    cliente.end();
    resetDb(function () {
      createDb(function () {
        console.log('resetDb')
        done();
      })
    })
  });

  it('should your tests', function (done) {

    describe('#indexOf()', function () {
      it('should return -1 when the value is not present', function () {
        assert.equal([1, 2, 3].indexOf(4), -1);
      });
    });


    done();
  });
});