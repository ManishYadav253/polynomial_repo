#pragma once
#include <vector>
#include <string>
#include <sstream>
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <iomanip>

// Polynomial is stored as coefficients in ascending degree order:
// coeffs[0] = constant, coeffs[1] = x^1, coeffs[2] = x^2, ...
struct StepResult {
    std::string expression;
    std::string explanation;
};

struct PolynomialResult {
    std::vector<double> coefficients;
    std::string expression;
    std::vector<StepResult> steps;
    std::string error;
};

struct DivisionResult {
    std::vector<double> quotient;
    std::vector<double> remainder;
    std::string quotientExpr;
    std::string remainderExpr;
    std::vector<StepResult> steps;
    std::string error;
};

class Polynomial {
public:
    std::vector<double> coeffs; // index = degree

    Polynomial() {}

    Polynomial(const std::vector<double>& c) : coeffs(c) {
        trim();
    }

    void trim() {
        while (coeffs.size() > 1 && std::abs(coeffs.back()) < 1e-12)
            coeffs.pop_back();
        if (coeffs.empty()) coeffs.push_back(0.0);
    }

    int degree() const {
        for (int i = (int)coeffs.size() - 1; i >= 0; i--)
            if (std::abs(coeffs[i]) > 1e-12) return i;
        return 0;
    }

    bool isZero() const {
        return degree() == 0 && std::abs(coeffs[0]) < 1e-12;
    }

    double evaluate(double x) const {
        double result = 0.0;
        double xpow = 1.0;
        for (size_t i = 0; i < coeffs.size(); i++) {
            result += coeffs[i] * xpow;
            xpow *= x;
        }
        return result;
    }

    std::string toString() const {
        if (isZero()) return "0";
        std::ostringstream oss;
        bool first = true;
        for (int i = (int)coeffs.size() - 1; i >= 0; i--) {
            double c = coeffs[i];
            if (std::abs(c) < 1e-12) continue;
            if (!first) {
                oss << (c < 0 ? " - " : " + ");
                c = std::abs(c);
            } else if (c < 0) {
                oss << "-";
                c = std::abs(c);
            }
            first = false;
            if (i == 0) {
                oss << formatNum(c);
            } else if (i == 1) {
                if (std::abs(c - 1.0) < 1e-12) oss << "x";
                else oss << formatNum(c) << "x";
            } else {
                if (std::abs(c - 1.0) < 1e-12) oss << "x^" << i;
                else oss << formatNum(c) << "x^" << i;
            }
        }
        return first ? "0" : oss.str();
    }

    static std::string formatNum(double v) {
        if (v == std::floor(v) && std::abs(v) < 1e9) {
            std::ostringstream oss;
            oss << (long long)v;
            return oss.str();
        }
        std::ostringstream oss;
        oss << std::fixed << std::setprecision(4) << v;
        std::string s = oss.str();
        size_t dot = s.find('.');
        if (dot != std::string::npos) {
            size_t last = s.find_last_not_of('0');
            if (last != std::string::npos && last > dot) s = s.substr(0, last + 1);
            else if (last == dot) s = s.substr(0, dot);
        }
        return s;
    }

    bool equals(const Polynomial& other) const {
        Polynomial a = *this, b = other;
        a.trim(); b.trim();
        if (a.coeffs.size() != b.coeffs.size()) return false;
        for (size_t i = 0; i < a.coeffs.size(); i++)
            if (std::abs(a.coeffs[i] - b.coeffs[i]) > 1e-9) return false;
        return true;
    }

    // Static operation methods
    static PolynomialResult add(const Polynomial& a, const Polynomial& b) {
        PolynomialResult res;
        res.steps.push_back({"(" + a.toString() + ") + (" + b.toString() + ")",
                              "Write both polynomials side by side"});

        size_t maxSize = std::max(a.coeffs.size(), b.coeffs.size());
        std::vector<double> c(maxSize, 0.0);
        for (size_t i = 0; i < a.coeffs.size(); i++) c[i] += a.coeffs[i];
        for (size_t i = 0; i < b.coeffs.size(); i++) c[i] += b.coeffs[i];

        res.steps.push_back({"Group like terms by degree",
                              "Add coefficients of matching degree terms"});

        Polynomial result(c);
        result.trim();
        res.coefficients = result.coeffs;
        res.expression = result.toString();
        res.steps.push_back({res.expression, "Simplified result"});
        return res;
    }

    static PolynomialResult subtract(const Polynomial& a, const Polynomial& b) {
        PolynomialResult res;
        res.steps.push_back({"(" + a.toString() + ") - (" + b.toString() + ")",
                              "Write both polynomials for subtraction"});
        res.steps.push_back({"Distribute the negative sign to all terms of the second polynomial",
                              "Change all signs of the subtrahend"});

        size_t maxSize = std::max(a.coeffs.size(), b.coeffs.size());
        std::vector<double> c(maxSize, 0.0);
        for (size_t i = 0; i < a.coeffs.size(); i++) c[i] += a.coeffs[i];
        for (size_t i = 0; i < b.coeffs.size(); i++) c[i] -= b.coeffs[i];

        Polynomial result(c);
        result.trim();
        res.coefficients = result.coeffs;
        res.expression = result.toString();
        res.steps.push_back({res.expression, "Simplified result"});
        return res;
    }

    static PolynomialResult multiply(const Polynomial& a, const Polynomial& b) {
        PolynomialResult res;
        res.steps.push_back({"(" + a.toString() + ") × (" + b.toString() + ")",
                              "Distribute each term of the first polynomial over the second"});

        int degA = a.degree(), degB = b.degree();
        std::vector<double> c(degA + degB + 1, 0.0);

        for (int i = 0; i <= degA; i++) {
            for (int j = 0; j <= degB; j++) {
                c[i + j] += a.coeffs[i] * b.coeffs[j];
            }
        }

        res.steps.push_back({"Multiply each term pair and add results of same degree",
                              "Result degree = deg(A) + deg(B) = " + std::to_string(degA) + " + " + std::to_string(degB) + " = " + std::to_string(degA+degB)});

        Polynomial result(c);
        result.trim();
        res.coefficients = result.coeffs;
        res.expression = result.toString();
        res.steps.push_back({res.expression, "Simplified product"});
        return res;
    }

    static DivisionResult divide(const Polynomial& num, const Polynomial& den) {
        DivisionResult res;
        if (den.isZero()) {
            res.error = "Division by zero polynomial";
            return res;
        }

        res.steps.push_back({"(" + num.toString() + ") ÷ (" + den.toString() + ")",
                              "Perform polynomial long division"});

        std::vector<double> remainder = num.coeffs;
        while (remainder.size() < (size_t)(num.degree() + 1)) remainder.push_back(0);
        std::vector<double> quotient;

        int denDeg = den.degree();
        int remDeg = (int)remainder.size() - 1;

        while (remDeg > 0 && std::abs(remainder.back()) < 1e-12) remDeg--;

        while (remDeg >= denDeg) {
            double coeff = remainder[remDeg] / den.coeffs[denDeg];
            int expDiff = remDeg - denDeg;
            if ((int)quotient.size() <= expDiff) quotient.resize(expDiff + 1, 0.0);
            quotient[expDiff] = coeff;

            std::ostringstream stepExpr;
            stepExpr << "Divide leading term: " << Polynomial::formatNum(remainder[remDeg]) << "x^" << remDeg
                     << " ÷ " << Polynomial::formatNum(den.coeffs[denDeg]) << "x^" << denDeg
                     << " = " << Polynomial::formatNum(coeff) << "x^" << expDiff;
            res.steps.push_back({stepExpr.str(), "Divide leading terms to find next quotient term"});

            for (int i = 0; i <= denDeg; i++) {
                remainder[i + expDiff] -= coeff * den.coeffs[i];
            }

            while (remDeg >= 0 && std::abs(remainder[remDeg]) < 1e-12) remDeg--;
            if (remDeg < 0) break;
        }

        if (quotient.empty()) quotient.push_back(0.0);
        Polynomial q(quotient), r(remainder);
        q.trim(); r.trim();

        res.quotient = q.coeffs;
        res.remainder = r.coeffs;
        res.quotientExpr = q.toString();
        res.remainderExpr = r.toString();
        res.steps.push_back({res.quotientExpr + " remainder " + res.remainderExpr, "Final result"});
        return res;
    }

    static PolynomialResult compose(const Polynomial& f, const Polynomial& g) {
        PolynomialResult res;
        res.steps.push_back({"f(g(x)) where f(x) = " + f.toString() + ", g(x) = " + g.toString(),
                              "Substitute g(x) into every occurrence of x in f(x)"});

        // Compute f(g(x)) = sum of f.coeffs[i] * g^i
        Polynomial result({0.0});
        Polynomial gPow({1.0}); // g^0 = 1

        for (size_t i = 0; i < f.coeffs.size(); i++) {
            if (std::abs(f.coeffs[i]) > 1e-12) {
                // result += f.coeffs[i] * gPow
                auto term = multiply(gPow, Polynomial({f.coeffs[i]}));
                auto addResult = add(result, Polynomial(term.coefficients));
                result = Polynomial(addResult.coefficients);
            }
            if (i + 1 < f.coeffs.size()) {
                auto nextPow = multiply(gPow, g);
                gPow = Polynomial(nextPow.coefficients);
            }
        }

        result.trim();
        res.coefficients = result.coeffs;
        res.expression = result.toString();
        res.steps.push_back({res.expression, "Simplified composition f(g(x))"});
        return res;
    }
};
