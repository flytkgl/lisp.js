 (function() {

  // local helpers  
  var p = function(a,b) { return new LISP.Pair(a,b); },
      sym = function(v) { return new LISP.Symbol(v); },
      s = function(v) { return new LISP.String(v); },
      n = function(v) { return new LISP.Number(v); },
      q = function(v) { return new LISP.Quoted(v); },
      nil = LISP.nil,
      
      test_interpreter = function(input, output) {
        equal(Interpreter.read_eval_print(input), output);
      };
 
  
  module("Interpreter", {
    
    teardown: function() {
      Interpreter.do("(define teardown_test 444)");
      Interpreter.read_eval_print("(reset)");
      try {
        Interpreter.do("teardown_test");
        ok(false, "Teardown error");
      } catch(e) {
        equal(e, "cannot resolve symbol 'teardown_test'");
      }
    }
  });
  
  test("Atoms", function() {
    test_interpreter("true","true");
    test_interpreter("false","false");
    test_interpreter("1234","1234");
    test_interpreter('"String"','"String"');
  });
  
  test("Lists", function() {
    test_interpreter("'(3)", "(3 . nil)");
    test_interpreter("'(8 3)", "(8 . (3 . nil))");
    test_interpreter("'(8 3 (4 8))", "(8 . (3 . ((4 . (8 . nil)) . nil)))");
    
    test_interpreter("(car '(8 4 3 2))", "8");
    test_interpreter("(cdr '(8 4 3 2))", "(4 . (3 . (2 . nil)))");
  });
  
  test("Quote", function() {
    test_interpreter("(quote Foo)", "Foo");
    test_interpreter("(quote (8 3))", "(8 . (3 . nil))");  
  });
  
  test("Mathematical Operations", function() {
    test_interpreter("(+ 7 6)", "13");
    test_interpreter("(- 7 6)", "1");
    test_interpreter("(* 7 6)", "42");
    test_interpreter("(/ 8 5)", "1.6");
    test_interpreter("(% 8 5)", "3");
  });
  
  test("String Operations", function() {
    test_interpreter('(+ "Hallo " "Welt")', '"Hallo Welt"');
    test_interpreter('(+ "Die Antwort ist " 42)', '"Die Antwort ist 42"');
  });
  
  test("Comparators", function() {
    test_interpreter("(eq? 5 6)", "false");
    test_interpreter("(eq? 6 6)", "true");
    test_interpreter("(gt? 5 6)", "false");
    test_interpreter("(gt? 6 5)", "true");
    test_interpreter("(gt? 6 6)", "false");
    test_interpreter("(ge? 5 6)", "false");
    test_interpreter("(ge? 6 6)", "true");
    test_interpreter("(ge? 6 5)", "true");
    test_interpreter("(lt? 5 6)", "true");
    test_interpreter("(lt? 6 5)", "false");
    test_interpreter("(lt? 6 6)", "false");
    test_interpreter("(le? 5 6)", "true");
    test_interpreter("(le? 6 6)", "true");
    test_interpreter("(le? 6 5)", "false");
  });
  
  test("Logical Operators", function() {
    test_interpreter("(and true true)", "true");
    test_interpreter("(and true false)", "false");
    test_interpreter("(and false true)", "false");
    test_interpreter("(and false false)", "false");
    
    test_interpreter("(or true true)", "true");
    test_interpreter("(or true false)", "true");
    test_interpreter("(or false true)", "true");
    test_interpreter("(or false false)", "false");
    
    test_interpreter("(xor true true)", "false");
    test_interpreter("(xor true false)", "true");
    test_interpreter("(xor false true)", "true");
    test_interpreter("(xor false false)", "false");
    
    test_interpreter("(not true)", "false");
    test_interpreter("(not false)", "true");
  });
  
  test("Define", function() {
    Interpreter.do("(define foo 3)");
    test_interpreter("foo", 3);
    
    Interpreter.do("(define bar (lambda (n) (+ n 1)))");
    test_interpreter("(bar 4)", 5);
    
    Interpreter.do("(define (baz n) (+ n 1))");
    test_interpreter("(baz 4)", 5);
    
    // multiple commands (like begin)
    Interpreter.do("(define (bam n) (set! n (+ n 1)) (set! n (* n 2)) n)");
    test_interpreter("(bam 4)", 10);
  });
  
  test("Lambdas", function() {
    test_interpreter("((lambda (n) (* n 2)) 5)", "10");
    test_interpreter("((lambda (n m) (* n m)) 5 6)", "30");
    
    // multiple commands (like begin)
    test_interpreter("((lambda (n) (set! n (+ n 1)) (set! n (* n 2)) n) 4)", 10);
  });
  
  test("let", function() {
    test_interpreter("(define a 8)", "8");
    test_interpreter("(let ((a 4) (b 5)) (+ a b))", "9");
    
    test_interpreter("a", "8");
    Interpreter.do("(define (test a b) (let ((b (* a b))) (lambda (c) (+ (+ a b) c))))");
    test_interpreter("((test 4 5) 6)", "30");
  });
  
  test("Closures", function() {
    test_interpreter("((lambda (n) ((lambda (m) (+ n m)) 7)) 8)", "15");
    
    Interpreter.do("(define (adder n) (lambda (m) (+ n m)))");
    Interpreter.do("(define add-2 (adder 2))");
    test_interpreter("(add-2 4)", "6");
  });
  
  test("Inner Functions", function() {
    Interpreter.do("(define (outer list) (define (inner tmp-list) (car tmp-list)) (inner list))");
    test_interpreter("(outer '(4 5 6 7 8 9))", "4");
    
    /**
    (define (test-max list)
      (define (helper tmp-list tmp-max) 
        (if (eq? tmp-list nil)
          tmp-max
        ; else
          (if (gt? (car tmp-list) tmp-max)
            (helper (cdr tmp-list) (car tmp-list))
          ; else  
            (helper (cdr tmp-list) tmp-max))))
      (helper list (car list))
    )
    */
    Interpreter.do("(define (test-max list) (define (helper tmp-list tmp-max) (if (eq? tmp-list nil) tmp-max (if (gt? (car tmp-list) tmp-max) (helper (cdr tmp-list) (car tmp-list)) (helper (cdr tmp-list) tmp-max)))) (helper list (car list)))");
    test_interpreter("(test-max '(50 12 33 105 9 2 77 8 54))", "105");
  }); 
  
  test("Introspection", function() {
    
    Interpreter.do("(define test 456)");
    test_interpreter("(defined? 'fofofo)", "false");
    test_interpreter("(defined? '+)", "true");
    test_interpreter("(defined? 'test)", "true");
    
    Interpreter.do("(define (foo f) (print f))");
    test_interpreter("(eq? (typeof foo) 'Lambda)", "true");
    test_interpreter("(eq? (typeof +) 'Builtin)", "true");
    test_interpreter("(eq? (typeof 345) 'Number)", "true");
    test_interpreter("(eq? (typeof \"foo\") 'String)", "true");
    test_interpreter("(eq? (typeof 'Foo) 'Symbol)", "true");
    test_interpreter("(eq? (typeof ''Foo) 'Quoted)", "true");
  });
  
  test("Work with Bindings", function() {
  
    Interpreter.do("(define (bindings foo) (get-bindings))");
    Interpreter.do("(define somebinding (bindings 5))");
    test_interpreter("(eval (+ foo 6) somebinding)", "11");
    test_interpreter("(defined? 'foo)", "false");
    test_interpreter("(eval (defined? 'foo) somebinding)", "true");
  });
  
  /**
  
    First test:
   (define foo nil)   
   (define return nil)
   (let ((val (call/cc 
       (lambda (cont) 
         (set! return cont)            
         1)
        ))) 
     (begin
       (set! foo (* val 2))
       (+ val 1)
   ))   
     
     (set! foo                 
   (return 22)
       */
  test("call/cc", function() {
    Interpreter.do("(define return nil)");
    test_interpreter("(let ((val (call/cc (lambda (cont) (set! return cont) 1)))) (begin (set! foo (* val 2)) (+ val 1)))", "2");
    Interpreter.do("(define foo nil)");
    test_interpreter("foo", "2");
    test_interpreter("(return 5)", "6");
    test_interpreter("foo", "10");    
  });
  
  test("Tail call optimization", function() {
    Interpreter.do("(define (count-define n) (if (le? n 0) 0 (count-define (- n 1))))");
    // should exceed stack size
    test_interpreter("(count-define 100000)", "0");
  
  
    Interpreter.do("(define count-lambda (lambda (n) (if (le? n 0) 0 (count-lambda (- n 1)))))");
    // should exceed stack size
    test_interpreter("(count-lambda 100000)", "0");
    
    // three layer recursion
    
    Interpreter.do("(define (test-f n) (if (le? n 0) 0 (test-g n)))");
    Interpreter.do("(define (test-g n) (test-h (+ n 1)))");
    Interpreter.do("(define (test-h n) (test-f (- n 2)))");
    test_interpreter("(test-f 50000)","0");
  });
})();