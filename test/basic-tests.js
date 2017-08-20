'use strict'

import css from 'css'
import { describe, it } from 'global-mocha'
import path from 'path'
import penthouse from '../lib/'
import { readFileSync as read } from 'fs'
import chai from 'chai'
chai.should() // binds globally on Object

// because dont want to fail tests on white space differences
function normalisedCssAst (cssString) {
  return css.parse(css.stringify(css.parse(cssString), { compress: true }))
}

function staticServerFileUrl (file) {
  return 'file://' + path.join(__dirname, 'static-server', file)
}

describe('basic tests of penthouse functionality', function () {
  var page1FileUrl = staticServerFileUrl('page1.html')
  var page1cssPath = path.join(__dirname, 'static-server', 'page1.css'),
    originalCss = read(page1cssPath).toString()

  // some of these tests take quite a while,
  // as we're starting up phantomjs for each
  this.timeout(10000)

  it('should return css', function (done) {
    penthouse({
      url: page1FileUrl,
      css: page1cssPath
    }, function (err, result) {
      if (err) { done(err) }
      try {
        css.parse(result)
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should return a css file whose parsed AST is equal to the the original\'s AST when the viewport is large', function (done) {
    var widthLargerThanTotalTestCSS = 1000,
      heightLargerThanTotalTestCSS = 1000
    penthouse({
      url: page1FileUrl,
      css: page1cssPath,
      width: widthLargerThanTotalTestCSS,
      height: heightLargerThanTotalTestCSS
    }, function (err, result) {
      if (err) {
        done(err)
        return
      }
      try {
        var resultAst = normalisedCssAst(result)
        var expectedAst = normalisedCssAst(originalCss)
        resultAst.should.eql(expectedAst)
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should return a subset of the original AST rules when the viewport is small', function (done) {
    var widthLargerThanTotalTestCSS = 1000,
      heightSmallerThanTotalTestCSS = 100
    penthouse({
      url: page1FileUrl,
      css: page1cssPath,
      width: widthLargerThanTotalTestCSS,
      height: heightSmallerThanTotalTestCSS
    }, function (err, result) {
      if (err) { done(err) }
      try {
        var resultAst = css.parse(result)
        var orgAst = css.parse(originalCss)
        resultAst.stylesheet.rules.should.have.length.lessThan(orgAst.stylesheet.rules.length)
        // not be empty
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should not crash on invalid css', function (done) {
    penthouse({
      url: page1FileUrl,
      css: path.join(__dirname, 'static-server', 'invalid.css')
    }, function (err, result) {
      if (err) {
        done(err)
        return
      }
      if (result.length === 0) {
        done(new Error('length should be > 0'))
        return
      }
      try {
        css.parse(result)
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should not crash on invalid media query', function (done) {
    penthouse({
      url: page1FileUrl,
      css: path.join(__dirname, 'static-server', 'invalid-media.css')
    }, function (err, result) {
      if (err) { done(err) }
      try {
        css.parse(result)
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should crash with errors in strict mode on invalid css', function (done) {
    penthouse({
      url: page1FileUrl,
      css: path.join(__dirname, 'static-server', 'invalid.css'),
      strict: true
    }, function (err) {
      if (err) {
        done()
      } else {
        done(new Error('Did not get error'))
      }
    })
  })

  it('should not crash on special chars', function (done) {
    penthouse({
      url: page1FileUrl,
      css: path.join(__dirname, 'static-server', 'special-chars.css')
    }, function (err, result) {
      if (err) { done(err) }
      try {
        css.parse(result)
        done()
      } catch (ex) {
        done(ex)
      }
    })
  })

  it('should surface parsing errors to the end user', function (done) {
    penthouse({
      css: 'missing.css'
    }, function (err) {
      if (err) {
        done()
      } else {
        done(new Error('Did not get error'))
      }
    })
  })

  it('should exit after timeout', function (done) {
    penthouse({
      url: page1FileUrl,
      css: page1cssPath,
      timeout: 100
    }, function (err) {
      if (err && /Penthouse timed out/.test(err)) {
        done()
      } else {
        done(new Error('Did not get timeout error'))
      }
    })
  })
})
