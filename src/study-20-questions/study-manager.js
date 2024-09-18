/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = require("jquery");
window.jQuery = window.$;
require("../js/jquery.i18n");
require("../js/jquery.i18n.messagestore");
require("jquery-ui-bundle");
let Handlebars = require("handlebars");
window.$.alpaca = require("alpaca");
window.bootstrap = require("bootstrap");
window._ = require("lodash");

//LOAD THE HTML FOR STUDY PAGES
import progressHTML from "../templates/progress.html";
Handlebars.registerPartial('prog', progressHTML);
import introHTML from "./templates/introduction.html";
import irb_LITW_HTML from "../templates/irb2-litw.html";
import quest1HTML from "./templates/questions1.html";
import quest2HTML from "./templates/questions2.html";
import demographicsHTML from "../templates/demographics.html";
import loadingHTML from "../templates/loading.html";
import resultsHTML from "./templates/results.html";
import resultsFooterHTML from "../templates/results-footer.html";
import commentsHTML from "../templates/comments.html";

require("../js/litw/jspsych-display-slide");
//CONVERT HTML INTO TEMPLATES
let introTemplate = Handlebars.compile(introHTML);
let irbTemplate = Handlebars.compile(irb_LITW_HTML);
let demographicsTemplate = Handlebars.compile(demographicsHTML);
let question1Template = Handlebars.compile(quest1HTML);
let question2Template = Handlebars.compile(quest2HTML);
let loadingTemplate = Handlebars.compile(loadingHTML);
let resultsTemplate = Handlebars.compile(resultsHTML);
let resultsFooterTemplate = Handlebars.compile(resultsFooterHTML);
let commentsTemplate = Handlebars.compile(commentsHTML);

//TODO: document "params.study_id" when updating the docs/7-ManageData!!!
module.exports = (function(exports) {
	const study_times= {
			SHORT: 5,
			MEDIUM: 10,
			LONG: 15,
		};
	let timeline = [];
	let params = {
		study_id: "c2b9e3c2-e317-44b9-a1ea-92418c89c1b1",
		questionsAndResponses: {},
		responsesAndStatements: {},
		numQuestions: 20,
		country: "",
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: "display-slide",
				template: introTemplate,
				display_element: $("#intro"),
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: "display-slide",
				template: irbTemplate,
				template_data: {
					time: study_times.SHORT,
				},
				display_element: $("#irb"),
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				type: "display-slide",
				template: demographicsTemplate,
				display_element: $("#demographics"),
				template_data: {
					local_data_id: 'LITW_DEMOGRAPHICS'
				},
				name: "demographics",
				finish: function(){
					let dem_data = $('#demographicsForm').alpaca().getValue();
					params.country = dem_data['demographics-country-grow'];
					LITW.data.addToLocal(this.template_data.local_data_id, dem_data);
					LITW.data.submitDemographics(dem_data);
				}
			},
			QUESTION1: {
				name: "questionnaire",
				type: "display-slide",
				template: question1Template,
				display_element: $("#question1"),
				display_next_button: false,
			},
			QUESTION2: {
				name: "questionnaire",
				type: "display-slide",
				template: question2Template,
				display_element: $("#question2"),
				display_next_button: false,
			},
			COMMENTS: {
				type: "display-slide",
				template: commentsTemplate,
				display_element: $("#comments"),
				name: "comments",
				finish: function(){
					var comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				type: "call-function",
				func: function(){
					calculateResults();
				}
			}
		}
	};

	function configureStudy() {
		params.slides.QUESTION1.template_data = getStudyQuestions(1, 50);
		params.slides.QUESTION2.template_data = getStudyQuestions(2, 100);
		timeline.push(params.slides.INTRODUCTION);
		timeline.push(params.slides.INFORMED_CONSENT);
		timeline.push(params.slides.DEMOGRAPHICS);
		timeline.push(params.slides.QUESTION1);
		timeline.push(params.slides.QUESTION2);
		timeline.push(params.slides.COMMENTS);
		timeline.push(params.slides.RESULTS);
	}

	function getStudyQuestions(pageNumber, progress) {
		let counter = 1;
		let numQ = 20;
		let quest = {
			progress: {
				value: progress
			},
			questions: []
		}
		while(counter <= numQ) {
			if (pageNumber === 1) {
				quest.questions.push({
					id: counter,
					text: counter + ". " + $.i18n(`litw-question-page1-prompt`)
				})
			} else {
				quest.questions.push({
					id: counter
				})
			}
			counter++;
		}
		return quest;
	}

	function calculateResults() {
		let results_data = {};
		let country_data = {};
		let totalNumOfPoints = 20;
		let personalScore = 0;
		let relationshipsScore = 0;
		let otherScore = 0;
		//Test data!
		if (Object.keys(params.responsesAndStatements).length === 0) {
			params.responsesAndStatements = {1: 'PS', 2: 'RR', 3: 'RR', 4: 'RR', 5: 'PS', 6: 'PS', 7: 'OS', 8: 'OS',
				9: 'RR', 10: 'PS', 11: 'PS', 12: 'PS', 13: 'RR', 14: 'PS',	15: 'OS', 16: 'OS', 17: 'RR', 18: 'PS',
				19: 'PS', 20: 'PS'};
		}
		if(Object.keys(params.questionsAndResponses).length === 0) {
			params.questionsAndResponses = {1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e', 6: 'f', 7: 'g', 8: 'i', 9: 'j',
				10: 'k', 11: 'l', 12: 'm', 13: 'n', 14: 'o', 15: 'p', 16: 'q', 17: 'r', 18: 's', 19: 't', 20: 'u'}
		}

		//TODO: Change these responses to be encoded [PS, RRoSS, NONE] instead of having the translatable string!
		for (const key in params.responsesAndStatements) {
    		if (params.responsesAndStatements[key] === "PS") {
      			personalScore++;
      		} else if (params.responsesAndStatements[key] === "RR") {
				relationshipsScore++;
			} else {
			otherScore++;
		}
    }
		results_data = {
			"personalScore": personalScore,
			"relationshipsScore": relationshipsScore,
			"otherScore": otherScore,
			"personalPercentage": (personalScore/totalNumOfPoints) * 100,
			"relationshipsPercentage": (relationshipsScore/totalNumOfPoints) * 100,
			"otherPercentage": (otherScore/totalNumOfPoints) * 100,
			"questionsAndResponses": params.questionsAndResponses,
			"responsesAndStatements": params.responsesAndStatements
		}
		country_data = {
			"country": params.country,
			"personalPercentage": (personalScore/totalNumOfPoints) * 100,
			"relationshipsPercentage": (relationshipsScore/totalNumOfPoints) * 100,
		}
		LITW.data.submitStudyData({results_data1 : results_data});
		LITW.data.submitStudyData({participant_country_data: country_data});
		chooseMessage(results_data);
		showResults(results_data, true)
	}

	function chooseMessage(results_data) {
		if(results_data.personalScore > results_data.relationshipsScore) {
			results_data.resultStatement1 = $.i18n('litw-results-private1');
			results_data.resultStatement2 = $.i18n('litw-results-private2');
		} else {
			results_data.resultStatement1 = $.i18n('litw-results-collective1');
			results_data.resultStatement2 = $.i18n('litw-results-collective2');
		}
	}

	function showResults(results = {}, showFooter = false) {
		if('PID' in params.URL) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		$("#results").html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooterTemplate(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: params.study_recommendation
				}
			));
		}
		$("#results").i18n();
		LITW.utils.showSlide("results");
	}

	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study partcipants.
			console.log(data);
		});
	}

	function startStudy() {
		// generate unique participant id and geolocate participant
		LITW.data.initialize();
		// save URL params
		params.URL = LITW.utils.getParamsURL();
		if( Object.keys(params.URL).length > 0 ) {
			LITW.data.submitData(params.URL,'litw:paramsURL');
		}
		// populate study recommendation
		LITW.engage.getStudiesRecommendation(2, (studies_list) => {
			params.study_recommendation = studies_list;
		});
		// initiate pages timeline
		jsPsych.init({
		  timeline: timeline
		});
	}

	function startExperiment(){
		//TODO These methods should be something like act1().then.act2().then...
		//... it is close enough to that... maybe the translation need to be encapsulated next.
		// get initial data from database (maybe needed for the results page!?)
		//readSummaryData();

		// determine and set the study language
		$.i18n().locale = LITW.locale.getLocale();
		var languages = {
			'en': './i18n/en.json?v=1.0',
			'pt': './i18n/pt-br.json?v=1.0',
		};
		//TODO needs to be a little smarter than this when serving specific language versions, like pt-BR!
		var language = LITW.locale.getLocale().substring(0,2);
		var toLoad = {};
		if(language in languages) {
			toLoad[language] = languages[language];
		} else {
			toLoad['en'] = languages['en'];
		}
		$.i18n().load(toLoad).done(
			function() {
				$('head').i18n();
				$('body').i18n();

				LITW.utils.showSlide("img-loading");
				//start the study when resources are preloaded
				jsPsych.pluginAPI.preloadImages(params.preLoad,
					function () {
						configureStudy();
						startStudy();
					},

					// update loading indicator
					function (numLoaded) {
						$("#img-loading").html(loadingTemplate({
							msg: $.i18n("litw-template-loading"),
							numLoaded: numLoaded,
							total: params.preLoad.length
						}));
					}
				);
			});
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		startExperiment();
	});
	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


